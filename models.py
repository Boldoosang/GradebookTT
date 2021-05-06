from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class User(db.Model):
    userID = db.Column(db.Integer, primary_key = True)
    username = db.Column(db.String(64), unique = True)
    password = db.Column(db.String(256), nullable = False)
    #

class Semester(db.Model):
    semesterID = db.Column(db.Integer, primary_key = True)
    semesterName = db.Column(db.String(16), nullable = False)
    semesterYear = db.Column(db.Integer, nullable = False)

class UserSemester(db.Model):
    userSemesterID = db.Column(db.Integer, primary_key = True)
    userID = db.Column(db.Integer, db.ForeignKey("user.userID"), nullable = False)
    semesterID = db.Column(db.Integer, db.ForeignKey("semester.semesterID"), nullable = False)

class Course(db.Model):
    courseCode = db.Column(db.String(16), primary_key = True)
    courseName = db.Column(db.String(64), nullable = False)
    userSemesterID = db.Column(db.Integer, db.ForeignKey("user_semester.userSemesterID"), nullable = False)


class Mark(db.Model):
    markID = db.Column(db.Integer, primary_key=True)
    courseCode = db.Column(db.String(16), db.ForeignKey("course.courseCode"), nullable = False)
    component = db.Column(db.String(64), nullable = False)
    receivedMark = db.Column(db.Float, nullable = False)
    totalMark = db.Column(db.Float, nullable = False)
    weighting = db.Column(db.Float, nullable = False)


class University(db.Model):
    universityName = db.Column(db.String(64), primary_key = True)
    universityLogo = db.Column(db.String(300), nullable = True)





