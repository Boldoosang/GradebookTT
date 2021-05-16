from flask import Flask, request
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required, JWTManager, current_user
from sqlalchemy.exc import IntegrityError, OperationalError
import os
import json

from models import db, User, UserSemester, UserCourse, University, Mark

def create_app():
    app = Flask(__name__)
    try:
        app.config.from_object('config.dev')
    except:
        app.config['ENV'] = os.environ.get("ENV", default="")
        app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get("DBURI")
        app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY")

    db.init_app(app)
    return app

app = create_app()
app.app_context().push()
jwt = JWTManager(app)


# Register a callback function that loades a user from your database whenever
# a protected route is accessed. This should return any python object on a
# successful lookup, or None if the lookup failed for any reason (for example
# if the user has been deleted from the database).
@jwt.user_lookup_loader
def user_lookup_callback(_jwt_header, jwt_data):
    identity = jwt_data["sub"]
    return User.query.filter_by(username=identity).one_or_none()

@app.route("/login", methods=["POST"])
def login():
    loginDetails = request.get_json()
    
    if loginDetails:
        if "username" in loginDetails and "password" in loginDetails:
            alreadyExists = User.query.filter_by(username=loginDetails["username"]).first()
            
            if not alreadyExists or not alreadyExists.checkPassword(loginDetails["password"]):
                return json.dumps({"error" : "Wrong username or password entered!"})

            if alreadyExists and alreadyExists.checkPassword(loginDetails["password"]):
                access_token = create_access_token(identity=loginDetails["username"])
                return json.dumps({"access_token" : access_token})

    return json.dumps({"error" : "Invalid login details supplied!"})

@app.route("/register", methods=["POST"])
def register():
    registrationData = request.get_json()

    if registrationData:
        if "username" in registrationData and "password" in registrationData and "confirmPassword" in registrationData:
            filteredUsername = registrationData["username"].replace(" ", "")
            if len(filteredUsername) < 6:
                return json.dumps({"error" : "Username too short!"})
            
            if registrationData["password"] != registrationData["confirmPassword"]:
                return json.dumps({"error" : "Passwords do not match!"})
            
            if len(registrationData["password"]) < 6:
                return json.dumps({"error" : "Password is too short!"})

            try:
                newUser = User(filteredUsername, registrationData["password"])
                db.session.add(newUser)
                db.session.commit()
                return json.dumps({"message" : "Sucesssfully registered!"})
            except IntegrityError:
                db.session.rollback()
                return json.dumps({"error" : "This user already exists!"})
            except OperationalError:
                print("Database not initialized!")
                return json.dumps({"error" : "Database has not been initialized! Please contact the administrator of the application!"})
            except:
                return json.dumps({"error" : "An unknown error has occurred!"})

    return json.dumps({"error" : "Invalid registration details supplied!"})

@app.route("/profile/password", methods=["PUT"])
@jwt_required()
def changePassword():
    newPasswordDetails = request.get_json()

    if newPasswordDetails:
        if "oldPassword" in newPasswordDetails and "password" in newPasswordDetails and "confirmPassword" in newPasswordDetails:
            if not current_user.checkPassword(newPasswordDetails["oldPassword"]):
                return json.dumps({"error" : "The original password you have entered is incorrect!"})

            if newPasswordDetails["password"] != newPasswordDetails["confirmPassword"]:
                return json.dumps({"error" : "Passwords do not match!"})
            
            if len(newPasswordDetails["password"]) < 6:
                return json.dumps({"error" : "Password is too short!"})

            try:
                current_user.setPassword(newPasswordDetails["password"])
                db.session.add(current_user)
                db.session.commit()
                return json.dumps({"message" : "Sucesssfully changed password!"})
            except OperationalError:
                print("Database not initialized!")
                return json.dumps({"error" : "Database has not been initialized! Please contact the administrator of the application!"})
            except:
                return json.dumps({"error" : "An unknown error has occurred!"})

    return json.dumps({"error" : "Invalid password details supplied!"})


@app.route("/identify", methods=["GET"])
@jwt_required()
def identify():
    if current_user:
        return json.dumps({"username" : current_user.username, "universityName" : current_user.enrolledUniversity})
    
    return json.dumps({"error" : "User is not logged in!"})

@app.route('/favicon.ico')
def favicon():
    return app.send_static_file('images/favicon.png')

@app.route('/logo.png')
def logo():
    return app.send_static_file('images/logo.png')

@app.route("/web", methods=["GET"])
def homepage():
    return app.send_static_file("index.html")

@app.route("/api/semesters", methods=["GET"])
@jwt_required()
def getUserSemesters():
    userSemesters = db.session.query(UserSemester).filter_by(userID = current_user.userID).all()

    if userSemesters:
        return json.dumps([userSemester.toDict() for userSemester in userSemesters])
    
    return json.dumps({"error" : "No enrolled semesters found for user!"})

@app.route("/api/semesters", methods=["POST"])
@jwt_required()
def enrollSemester():
    semesterDetails = request.get_json()
    if not semesterDetails:
        return json.dumps({"error" : "Invalid semester details supplied!"})

    
    if "semesterYear" in semesterDetails and "semesterTerm" in semesterDetails:
        if int(semesterDetails["semesterYear"]) < 2000 or int(semesterDetails["semesterYear"]) > 2050:
            return json.dumps({"error" : "Invalid semester year entered!"})
        
        if int(semesterDetails["semesterTerm"]) < 1 or int(semesterDetails["semesterTerm"]) > 3:
            return json.dumps({"error" : "Invalid semester term entered!"})

        formattedYear = str(semesterDetails["semesterYear"]) + "/" + str(int(semesterDetails["semesterYear"]) + 1)
        formattedTerm = "Semester " + str(semesterDetails["semesterTerm"])
        
        outcome = current_user.enrollSemester(semesterYear = formattedYear, semesterTerm = formattedTerm)

        if outcome == 1:
            return json.dumps({"message" : "Successfully enrolled in semester!"})
        elif outcome == 2:
            return json.dumps({"error" : "User is already enrolled in this semester!"})

    return json.dumps({"error" : "Unable to enroll in semester!"})


@app.route("/api/semesters", methods=["DELETE"])
@jwt_required()
def unenrollSemester():
    semesterDetails = request.get_json()

    if not semesterDetails:
        return json.dumps({"error" : "Invalid semester details supplied!"})

    if "semesterYear" in semesterDetails and "semesterTerm" in semesterDetails:
        if int(semesterDetails["semesterYear"]) < 2000 or int(semesterDetails["semesterYear"]) > 2050:
            return json.dumps({"error" : "Invalid semester year entered!"})
        
        if int(semesterDetails["semesterTerm"]) < 1 or int(semesterDetails["semesterTerm"]) > 3:
            return json.dumps({"error" : "Invalid semester term entered!"})

        formattedYear = str(semesterDetails["semesterYear"]) + "/" + str(int(semesterDetails["semesterYear"]) + 1)
        formattedTerm = "Semester " + str(semesterDetails["semesterTerm"])

        outcome = current_user.unenrollSemester(semesterYear = formattedYear, semesterTerm = formattedTerm)

        if outcome == 1:
            return json.dumps({"message" : "Successfully unenrolled from semester!"})
        elif outcome == 2:
            return json.dumps({"error" : "User was not enrolled in this semester!"})
        elif outcome == 3:
            return json.dumps({"error" : "Please remove all courses before unenrolling from a semester!"})

    return json.dumps({"error" : "Unable to unenroll from semester!"})


@app.route("/api/semesters/<userSemesterID>/courses", methods=["GET"])
@jwt_required()
def viewSemesterCourses(userSemesterID):
    if userSemesterID:
        foundSemester = db.session.query(UserSemester).filter_by(userID=current_user.userID, userSemesterID=userSemesterID).first()

        if not foundSemester:
            return json.dumps({"error" : "Semester not found!"})

        foundCourses = foundSemester.userCourses.filter_by(userSemesterID = foundSemester.userSemesterID).all()

        if not foundCourses:
            return json.dumps({"error" : "User is not enrolled in any courses for this semester!"})
        
        return json.dumps([foundCourse.toDict() for foundCourse in foundCourses])

    return json.dumps({"error" : "Unable to add course to semester!"})

@app.route("/api/semesters/<userSemesterID>/courses", methods=["POST"])
@jwt_required()
def addCourse(userSemesterID):
    courseDetails = request.get_json()

    if not courseDetails:
        return json.dumps({"error" : "Invalid course details supplied!"})


    if "courseCode" in courseDetails and "courseName" in courseDetails:
        if len(courseDetails["courseCode"].strip()) <= 3:
            return json.dumps({"error" : "Invalid course code supplied!"})

        if len(courseDetails["courseName"].strip()) <= 3:
            return json.dumps({"error" : "Invalid course name supplied!"})

        foundSemester = db.session.query(UserSemester).filter_by(userID=current_user.userID, userSemesterID=userSemesterID).first()

        if not foundSemester:
            return json.dumps({"error" : "Semester not found!"})

        foundCourse = foundSemester.userCourses.filter_by(userSemesterID = foundSemester.userSemesterID, courseCode = courseDetails["courseCode"]).first()

        if foundCourse:
            return json.dumps({"error" : "Course already exists for this semester!"})
        
        outcome = foundSemester.addCourse(courseCode = courseDetails["courseCode"], courseName = courseDetails["courseName"], credits = courseDetails["credits"], towardsSemesterGPA = courseDetails["towardsSemesterGPA"])

        if outcome:
            return json.dumps({"message" : "Successfully added course to semester!"})

    return json.dumps({"error" : "Unable to add course to semester!"})


@app.route("/api/semesters/<userSemesterID>/courses", methods=["PUT"])
@jwt_required()
def updateCourse(userSemesterID):
    courseDetails = request.get_json()

    if not courseDetails:
        return json.dumps({"error" : "Invalid course details supplied!"})

    if "userCourseID" not in courseDetails:
        return json.dumps({"error" : "No course ID supplied!"})

    foundCourseQuery = db.session.query(UserCourse).filter_by(userCourseID=courseDetails["userCourseID"]).first()

    if not foundCourseQuery:
        return json.dumps({"error" : "Invalid course!"})

    foundSemester = foundCourseQuery.semester.query.filter_by(userID = current_user.userID, userSemesterID = foundCourseQuery.userSemesterID).first()

    if not foundSemester:
        return json.dumps({"error" : "Course not found for this semester!"})

    courseCode = None
    courseName = None
    credits = None
    towardsSemesterGPA = True

    if "courseCode" in courseDetails:
        if len(courseDetails["courseCode"].strip()) <= 3:
            return json.dumps({"error" : "Invalid course code supplied!"})

        courseCode = courseDetails["courseCode"]

    if "courseName" in courseDetails:
        if len(courseDetails["courseName"].strip()) <= 3:
            return json.dumps({"error" : "Invalid course name supplied!"})

        courseName = courseDetails["courseName"]
    
    if "credits" in courseDetails:
        if int(courseDetails["credits"]) < 0 or int(courseDetails["credits"]) > 9:
            return json.dumps({"error" : "Invalid credit amount entered!"})

        credits = courseDetails["credits"]
    
    if "towardsSemesterGPA" in courseDetails:
        towardsSemesterGPA = courseDetails["towardsSemesterGPA"]
    
    outcome = foundSemester.updateCourse(userCourseID = foundCourseQuery.userCourseID, courseCode = courseCode, courseName = courseName, credits = credits, towardsSemesterGPA = towardsSemesterGPA)

    if outcome:
        return json.dumps({"message" : "Successfully updated course details in semester!"})

    return json.dumps({"error" : "Unable to update course details in semester!"})
    

@app.route("/api/semesters/<userSemesterID>/courses", methods=["DELETE"])
@jwt_required()
def leaveCourse(userSemesterID):
    courseDetails = request.get_json()

    if not courseDetails:
        return json.dumps({"error" : "Invalid course details supplied!"})

    if "userCourseID" in courseDetails:
        foundCourseQuery = db.session.query(UserCourse).filter_by(userCourseID=courseDetails["userCourseID"]).first()

        if not foundCourseQuery:
            return json.dumps({"error" : "Invalid course!"})

        foundSemester = foundCourseQuery.semester.query.filter_by(userID = current_user.userID, userSemesterID = foundCourseQuery.userSemesterID).first()

        if not foundSemester:
            return json.dumps({"error" : "Course not found for this semester!"})
        
        outcome = foundSemester.removeCourse(userCourseID = foundCourseQuery.userCourseID)

        if outcome:
            return json.dumps({"message" : "Successfully removed course from semester!"})

    return json.dumps({"error" : "Unable to remove course from semester!"})

@app.route("/api/semesters/<userSemesterID>/courses/<userCourseID>/marks", methods=["POST"])
@jwt_required()
def addCourseMark(userSemesterID, userCourseID):
    markDetails = request.get_json()

    if not markDetails:
        return json.dumps({"error" : "Invalid mark details supplied!"})

    if "component" not in markDetails or "weighting" not in markDetails:
        return json.dumps({"error" : "Invalid mark details supplied!"})

    if len(markDetails["component"].strip()) <= 3:
        return json.dumps({"error" : "Invalid component name supplied!"})

    totalMark = None
    receivedMark = None

    if "totalMark" in markDetails:
        totalMark = markDetails["totalMark"]

    if "receivedMark" in markDetails:
        receivedMark = markDetails["receivedMark"]

    if userCourseID:
        foundCourseQuery = db.session.query(UserCourse).filter_by(userCourseID=userCourseID).first()

        if not foundCourseQuery:
            return json.dumps({"error" : "Invalid course!"})

        foundSemester = foundCourseQuery.semester.query.filter_by(userID = current_user.userID, userSemesterID = foundCourseQuery.userSemesterID).first()

        if not foundSemester:
            return json.dumps({"error" : "Course not found for this semester!"})
        
        outcome = foundCourseQuery.addMark(component = markDetails["component"], totalMark = totalMark, weighting = markDetails["weighting"], receivedMark=receivedMark)

        if outcome == 1:
            return json.dumps({"message" : "Successfully added mark to course!"})
        elif outcome == 2:
            return json.dumps({"error" : "Mark already exists for this course component!"})

    return json.dumps({"error" : "Unable to add mark to course!"})

@app.route("/api/semesters/<userSemesterID>/courses/<userCourseID>/marks", methods=["DELETE"])
@jwt_required()
def removeCourseMark(userSemesterID, userCourseID):
    markDetails = request.get_json()

    if not markDetails:
        return json.dumps({"error" : "Invalid mark details supplied!"})

    if "markID" not in markDetails:
        return json.dumps({"error" : "Invalid mark details supplied!"})

    foundMark = db.session.query(Mark).filter_by(markID=markDetails["markID"]).first()

    if not foundMark:
        return json.dumps({"error" : "Mark not found!"})

    foundCourseQuery = foundMark.userCourse.query.filter_by(userCourseID = userCourseID).first()

    foundSemester = foundCourseQuery.semester.query.filter_by(userID = current_user.userID, userSemesterID = foundCourseQuery.userSemesterID).first()

    if not foundSemester:
        return json.dumps({"error" : "Mark for course not found for this semester!"})
    
    print(markDetails)
    outcome = foundCourseQuery.removeMark(markID = markDetails["markID"])

    if outcome:
        return json.dumps({"message" : "Successfully removed mark from course!"})

    return json.dumps({"error" : "Unable to remove mark from course!"})


@app.route("/api/semesters/<userSemesterID>/courses/<userCourseID>/marks", methods=["PUT"])
@jwt_required()
def updateCourseMark(userSemesterID, userCourseID):
    markDetails = request.get_json()

    if not markDetails:
        return json.dumps({"error" : "Invalid mark details supplied!"})

    if "markID" not in markDetails:
        return json.dumps({"error" : "Invalid mark details supplied!"})

    foundMark = db.session.query(Mark).filter_by(markID=markDetails["markID"]).first()

    if not foundMark:
        return json.dumps({"error" : "Mark not found!"})

    foundCourseQuery = foundMark.userCourse.query.filter_by(userCourseID = userCourseID).first()

    foundSemester = foundCourseQuery.semester.query.filter_by(userID = current_user.userID, userSemesterID = foundCourseQuery.userSemesterID).first()

    if not foundSemester:
        return json.dumps({"error" : "Mark for course not found for this semester!"})

    component = None
    totalMark = None
    receivedMark = None
    weighting = None

    if "component" in markDetails:
        component = markDetails["component"]

        if len(markDetails["component"].strip()) <= 3:
            return json.dumps({"error" : "Invalid component name supplied!"})

    if "totalMark" in markDetails:
        if markDetails["totalMark"]:
            if float(markDetails["totalMark"]) < 0 or float(markDetails["totalMark"]) > 100:
                return json.dumps({"error" : "Invalid total mark entered!"})

            totalMark = markDetails["totalMark"]
        else:
            return json.dumps({"error" : "Invalid total mark entered!"})
    
    if "receivedMark" in markDetails:
        if markDetails["receivedMark"]:
            try:
                if float(markDetails["receivedMark"]) < 0 or float(markDetails["receivedMark"]) > 100:
                    return json.dumps({"error" : "Invalid received mark entered!"})
                
                receivedMark = markDetails["receivedMark"]
            except:
                receivedMark = None
        else:
            receivedMark = None

    if "weighting" in markDetails:
        if markDetails["weighting"]:
            if float(markDetails["weighting"]) < 0 or float(markDetails["weighting"]) > 100:
                return json.dumps({"error" : "Invalid weighting entered!"})
            
            weighting = markDetails["weighting"]
        else:
            return json.dumps({"error" : "Invalid weighting entered!"})


    outcome = foundCourseQuery.updateMark(markID=markDetails["markID"], component=component, totalMark=totalMark, weighting=weighting, receivedMark=receivedMark)

    if outcome:
        return json.dumps({"message" : "Successfully updated mark in course!"})

    return json.dumps({"error" : "Unable to update mark in course!"})

@app.route("/profile/university", methods=["PUT"])
@jwt_required()
def updateUniversity():
    universityDetails = request.get_json()

    if not universityDetails:
        return json.dumps({"error" : "Invalid university details supplied!"})


    if "universityName" in universityDetails:
        outcome = current_user.updateUniversity(universityName=universityDetails["universityName"])

        if outcome:
            return json.dumps({"message" : "Successfully updated university!"})

    return json.dumps({"error" : "Unable to update university!"})