FROM mcr.microsoft.com/mssql/server:2022-latest

# Set environment variables
ENV ACCEPT_EULA=Y
ENV SA_PASSWORD=YourStrongPassword123!
ENV MSSQL_PID=Express

# Copy initialization scripts
COPY init.sql /usr/src/app/init.sql
COPY setup.sh /usr/src/app/setup.sh

# Make setup script executable
USER root
RUN chmod +x /usr/src/app/setup.sh

# Switch back to mssql user
USER mssql

EXPOSE 1433

# Run setup script after SQL Server starts
CMD ["/usr/src/app/setup.sh"]