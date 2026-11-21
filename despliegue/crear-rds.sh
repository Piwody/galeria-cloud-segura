#!/usr/bin/env bash
# Crea la base de datos compartida de Muralia en Amazon RDS (PostgreSQL) con autenticación IAM.
# Se corre una sola vez en AWS CloudShell con la cuenta dueña del proyecto.
set -e
export AWS_PAGER=""
REGION=us-east-1
CUENTA=$(aws sts get-caller-identity --query Account --output text)
INSTANCIA=muralia-db

echo "1/5 Grupo de seguridad (puerto 5432 de PostgreSQL)"
VPC=$(aws ec2 describe-vpcs --region $REGION --filters Name=isDefault,Values=true --query 'Vpcs[0].VpcId' --output text)
SG=$(aws ec2 describe-security-groups --region $REGION --filters Name=group-name,Values=muralia-db-sg Name=vpc-id,Values=$VPC --query 'SecurityGroups[0].GroupId' --output text)
if [ "$SG" = "None" ]; then
  SG=$(aws ec2 create-security-group --region $REGION --group-name muralia-db-sg --description "PostgreSQL de Muralia" --vpc-id $VPC --query GroupId --output text)
  aws ec2 authorize-security-group-ingress --region $REGION --group-id $SG --protocol tcp --port 5432 --cidr 0.0.0.0/0 > /dev/null
fi
echo "   $SG"

echo "2/5 Instancia RDS PostgreSQL (tarda entre 5 y 10 minutos)"
if ! aws rds describe-db-instances --region $REGION --db-instance-identifier $INSTANCIA > /dev/null 2>&1; then
  aws rds create-db-instance --region $REGION \
    --db-instance-identifier $INSTANCIA \
    --engine postgres \
    --db-instance-class db.t4g.micro \
    --allocated-storage 20 --storage-type gp3 --storage-encrypted \
    --db-name muralia \
    --master-username muralia_admin --manage-master-user-password \
    --enable-iam-database-authentication \
    --publicly-accessible \
    --vpc-security-group-ids $SG \
    --backup-retention-period 1 --no-multi-az \
    --query 'DBInstance.DBInstanceStatus' --output text
fi
aws rds wait db-instance-available --region $REGION --db-instance-identifier $INSTANCIA
HOST=$(aws rds describe-db-instances --region $REGION --db-instance-identifier $INSTANCIA --query 'DBInstances[0].Endpoint.Address' --output text)
RID=$(aws rds describe-db-instances --region $REGION --db-instance-identifier $INSTANCIA --query 'DBInstances[0].DbiResourceId' --output text)
SECRETO=$(aws rds describe-db-instances --region $REGION --db-instance-identifier $INSTANCIA --query 'DBInstances[0].MasterUserSecret.SecretArn' --output text)
echo "   $HOST"

echo "3/5 Usuario muralia_app (entra solo con token IAM, sin contraseña)"
command -v psql > /dev/null || sudo dnf install -y -q postgresql15 > /dev/null
export PGPASSWORD=$(aws secretsmanager get-secret-value --region $REGION --secret-id "$SECRETO" --query SecretString --output text | python3 -c 'import json,sys; print(json.load(sys.stdin)["password"])')
export PGSSLMODE=require
psql "host=$HOST port=5432 dbname=muralia user=muralia_admin" -v ON_ERROR_STOP=1 -q <<'SQL'
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'muralia_app') THEN
    CREATE ROLE muralia_app LOGIN;
  END IF;
END $$;
GRANT rds_iam TO muralia_app;
GRANT muralia_app TO muralia_admin;
ALTER DATABASE muralia OWNER TO muralia_app;
ALTER SCHEMA public OWNER TO muralia_app;
SQL
unset PGPASSWORD

echo "4/5 Permiso IAM para conectarse (backend y equipo)"
POLITICA=$(cat <<JSON
{"Version":"2012-10-17","Statement":[
 {"Sid":"ConectarseComoMuraliaApp","Effect":"Allow","Action":"rds-db:connect","Resource":"arn:aws:rds-db:$REGION:$CUENTA:dbuser:$RID/muralia_app"},
 {"Sid":"EncontrarLaInstancia","Effect":"Allow","Action":"rds:DescribeDBInstances","Resource":"arn:aws:rds:$REGION:$CUENTA:db:$INSTANCIA"}]}
JSON
)
aws iam put-user-policy --user-name muralia-backend --policy-name muralia-rds-conexion --policy-document "$POLITICA"
aws iam put-group-policy --group-name muralia-equipo --policy-name muralia-rds-conexion --policy-document "$POLITICA"

echo "5/5 Listo"
echo "   Base:    $HOST"
echo "   Usuario: muralia_app (token IAM)"
echo "   Para apagarla cuando no la usen: aws rds stop-db-instance --db-instance-identifier $INSTANCIA"
