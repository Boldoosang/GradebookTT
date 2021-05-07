from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class User(db.Model):
    userID = db.Column(db.Integer, primary_key = True)
    username = db.Column(db.String(64), unique = True)
    password = db.Column(db.String(300), nullable = False)
    enrolledSemesters = db.relationship("UserSemester", backref = "user", uselist = False)

    def __init__(self, username, password):
        self.username = username
        self.setPassword(password)

    def setPassword(self, password):
        self.password = generate_password_hash(password, method='sha256')
    
    def checkPassword(self, password):
        return check_password_hash(self.password, password)

    def toDict(self):
        return {
            "userID" : self.userID,
            "username" : self.username,
            "password" : self.password
        }
    
    def enrollSemester(self, semesterYear, semesterTerm):
        existingSemester = None

        if self.enrolledSemesters:
            existingSemester = self.enrolledSemesters.query.filter_by(semesterYear = semesterYear, semesterTerm = semesterTerm).first()

        if existingSemester:
            print("User is already enrolled in this semester!")
            return False
        
        try:
            newUserSemester = UserSemester(userID = self.userID, semesterYear = semesterYear, semesterTerm = semesterTerm)
            db.session.add(newUserSemester)
            db.session.commit()
            print("Enrolled user in semester!")
            return True
        except:
            db.session.rollback()
            print("Unable to enroll user in semester!")
            return False

    def unenrollSemester(self, semesterYear, semesterTerm):
        existingSemester = None

        if self.enrolledSemesters:
            existingSemester = self.enrolledSemesters.query.filter_by(semesterYear = semesterYear, semesterTerm = semesterTerm).first()

        if not existingSemester:
            print("User is not enrolled in this semester!")
            return False
        
        try:
            db.session.delete(existingSemester)
            db.session.commit()
            print("Unenrolled user from semester!")
            return True
        except:
            db.session.rollback()
            print("Unable to unenroll user from semester!")
            return False

class UserSemester(db.Model):
    userSemesterID = db.Column(db.Integer, primary_key = True)
    userID = db.Column(db.Integer, db.ForeignKey("user.userID"), nullable = False)
    semesterYear = db.Column(db.String(16), nullable = False)
    semesterTerm = db.Column(db.String(16), nullable = False)

    def toDict(self):
        return {
            "userSemesterID" : self.userSemesterID,
            "userID" : self.userID,
            "semesterYear" : self.semesterYear,
            "semesterTerm" : self.semesterTerm
        }

class UserCourse(db.Model):
    courseCode = db.Column(db.String(16), primary_key = True)
    courseName = db.Column(db.String(64), nullable = False)
    credits = db.Column(db.Integer, nullable = False)
    overallMark = db.Column(db.Float, nullable = True)
    overallGrade = db.Column(db.String(5), nullable = True)
    towardsSemesterGPA = db.Column(db.Boolean, default=True, nullable = False)
    userSemesterID = db.Column(db.Integer, db.ForeignKey("user_semester.userSemesterID"), nullable = False)
    marks = db.relationship("Mark", backref = "userCourse", uselist = False)


    def toDict(self):
        return {
            "courseCode" : self.courseCode,
            "courseName" : self.courseName,
            "credits" : self.credits,
            "userSemesterID" : self.userSemesterID,
            "marks" : self.marks
        }

    def addMark(self, courseCode, component, receivedMark=None, totalMark, weighting):
        try:
            newMark = Mark(courseCode=courseCode, component=component, receivedMark=receivedMark, totalMark=totalMark, weighting=weighting)
            db.session.add(newMark)
            db.session.commit()
            print("Added mark to course!")
            return True
        except:
            db.session.rollback()
            print("Unable to add mark to course!")
            return False

class Mark(db.Model):
    markID = db.Column(db.Integer, primary_key=True)
    courseCode = db.Column(db.String(16), db.ForeignKey("user_course.courseCode"), nullable = False)
    component = db.Column(db.String(64), nullable = False)
    receivedMark = db.Column(db.Float, nullable = True)
    totalMark = db.Column(db.Float, nullable = False)
    weighting = db.Column(db.Float, nullable = False)

    def toDict(self):
        return {
            "markID" : self.markID,
            "courseCode" : self.courseCode,
            "componenet" : self.component,
            "receivedMark" : self.receivedMark,
            "totalMark" : self.totalMark,
            "weighting" : self.weighting
        }


class University(db.Model):
    universityName = db.Column(db.String(64), primary_key = True)
    universityLogo = db.Column(db.String(300), nullable = True)

    def toDict(self):
        return {
            "universityName" : self.universityName,
            "universityLogo" : self.universityLogo
        }





