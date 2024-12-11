from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

# SQLAlchemy Base for ORM
Base = declarative_base()
SNOWFLAKE_CONFIG = {
    "user": "hindelk",
    "password": "Rcw2025!!",
    "account": "wx41094.ca-central-1.aws",  # Ex: abc12345.eu-central-1
    "warehouse": "COMPUTE_WH",
    "database": "RECRUITMENT_PLATFORM",
    "schema": "PUBLIC",
}
# Create a Snowflake connection URL
def get_snowflake_url(config):
    return f"snowflake://{config['user']}:{config['password']}@{config['account']}/{config['database']}/{config['schema']}?warehouse={config['warehouse']}"

# Initialize the database engine
DATABASE_URL = get_snowflake_url(SNOWFLAKE_CONFIG)
engine = create_engine(DATABASE_URL)

# Create a sessionmaker
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()



