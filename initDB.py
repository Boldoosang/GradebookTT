from main import app
from models import db, User, UserCourse, UserSemester, Mark
import os

db.create_all(app=app)

print("Database has been initialized!")