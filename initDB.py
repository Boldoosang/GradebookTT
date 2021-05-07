from main import app
from models import db, User, UserCourse, UserSemester, Mark
import os

os.remove("gradebookTT.db")

db.create_all(app=app)

user1 = User("Tommy", "test123")
db.session.add(user1)
db.session.commit()

user1.enrollSemester("2020/2021", "Semester_2")
studentSemester = db.session.query(UserSemester).filter_by(userID = user1.userID).first()

studentSemester.addCourse("COMP 2609", "Independent Programming")

COMP2609 = db.session.query(UserCourse).first()
COMP2609.addMark(component="CW Exam 1", totalMark = 50, weighting = 10, receivedMark=None)
COMP2609.updateMark(markID=1, receivedMark=45)

COMP2609.updateOverallMarks()

print("Database has been initialized!")