#Added comments to understand why this?
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

#This is the actual connection point to the database. It manages the "low-level" communication between Python and your SQL server.
engine = create_engine(DATABASE_URL) # type: ignore

#This is a factory for database sessions. Think of a "session" as a single conversation or transaction with the database. autocommit=False ensures changes aren't saved until you explicitly call db.commit().
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

#This creates a base class. When you create your data models (like a User or Product class), they will inherit from Base so SQLAlchemy knows they are mapped to database tables.
Base = declarative_base()


"""
get_db(): This is a Generator/Dependency.
-It opens a new session (db = SessionLocal()).
-yield db delivers that session to your route or function.
-finally: db.close() ensures the connection is always closed after the request is finished, preventing "too many connections" errors. 
"""
def get_db():
  db= SessionLocal()
  try:
    yield db
  finally:
    db.close()