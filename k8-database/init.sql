-- This script runs when the container starts for the first time

-- Create the application database (if not exists)
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'AppDB')
BEGIN
    CREATE DATABASE AppDB;
END
GO

-- Switch to the application database
USE AppDB;
GO