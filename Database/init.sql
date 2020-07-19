# noinspection SqlNoDataSourceInspectionForFile
# Creating a MySQL user for Debezium
CREATE USER 'debezium'@'localhost' IDENTIFIED BY 'dbz';
GRANT SELECT, RELOAD, SHOW DATABASES, REPLICATION SLAVE, REPLICATION CLIENT  ON *.* TO 'debezium' IDENTIFIED BY 'dbz';

# Create the database that we'll use to populate data and watch the effect in the binlog
CREATE DATABASE test;
GRANT ALL PRIVILEGES ON test.* TO 'mysqluser'@'%';