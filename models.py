from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class User(db.Model):
    userID = db.Column(db.Integer, primary_key = True)
    username = db.Column(db.String(64), unique = True)
    password = db.Column(db.String(300), nullable = False)
    enrolledSemesters = db.relationship("UserSemester", backref = "user", uselist = False)
    enrolledUniversity = db.Column(db.String(64), db.ForeignKey("university.universityName"), nullable = True)

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
            "password" : self.password,
            "university" : self.university
        }
    
    def enrollSemester(self, semesterYear, semesterTerm):
        existingSemester = None

        if self.enrolledSemesters:
            existingSemester = self.enrolledSemesters.query.filter_by(semesterYear = semesterYear, semesterTerm = semesterTerm).first()

        if existingSemester:
            print("User is already enrolled in this semester!")
            return 2
        
        try:
            newUserSemester = UserSemester(userID = self.userID, semesterYear = semesterYear, semesterTerm = semesterTerm)
            db.session.add(newUserSemester)
            db.session.commit()
            print("Enrolled user in semester!")
            return 1
        except:
            db.session.rollback()
            print("Unable to enroll user in semester!")
            return -1

    def unenrollSemester(self, semesterYear, semesterTerm):
        existingSemester = None

        if self.enrolledSemesters:
            existingSemester = self.enrolledSemesters.query.filter_by(semesterYear = semesterYear, semesterTerm = semesterTerm).first()

        if not existingSemester:
            print("User is not enrolled in this semester!")
            return 2
        
        try:
            db.session.delete(existingSemester)
            db.session.commit()
            print("Unenrolled user from semester!")
            return 1
        except:
            db.session.rollback()
            print("Unable to unenroll user from semester!")
            return 0

    def updateUniversity(self, universityName):
        foundUniversity = db.session.query(University).filter_by(universityName=universityName).first()

        updatedUniversity = None

        if foundUniversity:
            updatedUniversity = foundUniversity

        try:
            self.university = updatedUniversity
            db.session.add(self)
            db.session.commit()
            return True
        except:
            db.session.rollback()
            print("Unable to update university!")
            return False
        
        return False

class UserSemester(db.Model):
    userSemesterID = db.Column(db.Integer, primary_key = True)
    userID = db.Column(db.Integer, db.ForeignKey("user.userID"), nullable = False)
    semesterYear = db.Column(db.String(16), nullable = False)
    semesterTerm = db.Column(db.String(16), nullable = False)
    userCourses = db.relationship("UserCourse", backref="semester", lazy="dynamic")

    def toDict(self):
        return {
            "userSemesterID" : self.userSemesterID,
            "userID" : self.userID,
            "semesterYear" : self.semesterYear,
            "semesterTerm" : self.semesterTerm
        }

    def addCourse(self, courseCode, courseName, credits = 3, towardsSemesterGPA = True):
        newCourse = UserCourse(userSemesterID = self.userSemesterID, courseCode = courseCode, courseName = courseName, credits = credits, towardsSemesterGPA = towardsSemesterGPA)

        try:
            db.session.add(newCourse)
            db.session.commit()
            print("Course successfully added!")
            return True
        except:
            db.session.rollback()
            print("Unable to add course to database!")
            return False

    def removeCourse(self, userCourseID):
        foundCourse = self.userCourses.filter_by(userCourseID = userCourseID).first()

        if not foundCourse:
            print("Course does not exist!")
            return False
        
        try:
            db.session.delete(foundCourse)
            db.session.commit()
            print("Course successfully deleted!")
            return True
        except:
            db.session.rollback()
            print("Unable to remove course from database!")
            return False

    def updateCourse(self, userCourseID, courseCode = None, courseName = None, credits = None, towardsSemesterGPA = None):
        matchingCourse = self.userCourses.filter_by(userCourseID=userCourseID).first()

        if not matchingCourse:
            print("No matching course found!")
            return False

        
        if courseCode:
            matchingCourse.courseCode = courseCode
        
        if courseName:
            matchingCourse.courseName = courseName
        
        if credits:
            matchingCourse.credits = credits
        
        if towardsSemesterGPA:
            mathcingCourse.towardsSemesterGPA = towardsSemesterGPA

        try:
            db.session.add(matchingCourse)
            db.session.commit()
            print("Course updated!")
            return True
        except:
            db.session.rollback()
            print("Unable to update course!")
            return False

class UserCourse(db.Model):
    userCourseID = db.Column(db.Integer, primary_key = True)
    courseCode = db.Column(db.String(16), nullable = False)
    courseName = db.Column(db.String(64), nullable = False)
    credits = db.Column(db.Integer, nullable = False, default=3)
    overallMark = db.Column(db.Float, nullable = True)
    towardsSemesterGPA = db.Column(db.Boolean, default=True, nullable = False)
    userSemesterID = db.Column(db.Integer, db.ForeignKey("user_semester.userSemesterID"), nullable = False)
    marks = db.relationship("Mark", backref = "userCourse", lazy="dynamic")


    def toDict(self):
        return {
            "userCourseID" : self.userCourseID,
            "courseCode" : self.courseCode,
            "courseName" : self.courseName,
            "credits" : self.credits,
            "overallMark" : self.overallMark,
            "towardsSemesterGPA" : self.towardsSemesterGPA,
            "userSemesterID" : self.userSemesterID,
            "marks" : None if not self.marks else [mark.toDict() for mark in self.marks]
        }

    def addMark(self, component, totalMark, weighting, receivedMark=None):
        try:
            newMark = Mark(userCourseID=self.userCourseID, component=component, receivedMark=receivedMark, totalMark=totalMark, weighting=weighting)
            db.session.add(newMark)
            db.session.commit()
            print("Added mark to course!")
            return True
        except:
            db.session.rollback()
            print("Unable to add mark to course!")
            return False

    def updateMark(self, markID, component = None, totalMark = None, weighting = None, receivedMark=None):
        foundMark = self.marks.filter_by(userCourseID=self.userCourseID, markID=markID).first()
            
        if not foundMark:
            print("No mark found!")
            return False

        try:
            if component:
                foundMark.component = component
            
            if totalMark:
                foundMark.totalMark = totalMark
            
            if weighting:
                foundMark.weighting = weighting
            
            if receivedMark:
                foundMark.receivedMark = receivedMark

            db.session.add(foundMark)
            db.session.commit()
            print("Updated mark in course!")
            return True
        except:
            db.session.rollback()
            print("Unable to update mark in course!")
            return False

    def removeMark(self, markID):
        foundMark = self.marks.filter_by(userCourseID=self.userCourseID, markID=markID).first()

        if not foundMark:
            print("Mark not found!")
            return False

        try:
            db.session.delete(foundMark)
            db.session.commit()
            print("Removed mark from course!")
            return True
        except:
            db.session.rollback()
            print("Unable to remove mark from course!")
            return False

    def updateOverallMarks(self):
        courseMarks = self.marks.filter_by().all()

        if not courseMarks:
            print("No course marks found for this course!")
            return False

        overallMark = 0
        for courseMark in courseMarks:
            if courseMark:
                mark = courseMark.calculateWeightedMark()
                if mark:
                    overallMark += mark
    
        try:
            self.overallMark = overallMark
            db.session.add(self)
            print("Overall marks updated for course!")
            db.session.commit()
        except:
            print("Unable to update course marks!")
            db.session.rollback()
            return False
              
class Mark(db.Model):
    markID = db.Column(db.Integer, primary_key=True)
    userCourseID = db.Column(db.String(16), db.ForeignKey("user_course.userCourseID"), nullable = False)
    component = db.Column(db.String(64), nullable = False)
    receivedMark = db.Column(db.Float, nullable = True)
    totalMark = db.Column(db.Float, nullable = False)
    weighting = db.Column(db.Float, nullable = False)

    def toDict(self):
        return {
            "markID" : self.markID,
            "userCourseID" : self.userCourseID,
            "component" : self.component,
            "receivedMark" : self.receivedMark,
            "totalMark" : self.totalMark,
            "weightedMark" : self.calculateWeightedMark(),
            "weighting" : self.weighting
        }

    def calculateWeightedMark(self):
        if not self.receivedMark:
            return None
        
        return (self.receivedMark/self.totalMark)*self.weighting

class University(db.Model):
    universityName = db.Column(db.String(64), primary_key = True)
    universityLogo = db.Column(db.String(300), nullable = True)
    students = db.relationship("User", lazy="dynamic", backref="university", uselist= True)
    
    def toDict(self):
        return {
            "universityName" : self.universityName,
            "universityLogo" : self.universityLogo
        }