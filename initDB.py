from main import app
from models import db, User, UserCourse
import os

os.remove("gradebookTT.db")

db.create_all(app=app)

user1 = User("Tommy", "test123")
db.session.add(user1)
db.session.commit()

user1.enrollSemester("2020/2021", "Semester_2")

COMP2609 = UserCourse(courseCode="COMP2609", courseName="Test Course", credits=3, userSemesterID=1)
db.session.add(COMP2609)
db.session.commit()

print(COMP2609.toDict())




print("Database has been initialized!")