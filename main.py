from flask import Flask, request
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required, JWTManager
from sqlalchemy.exc import IntegrityError, OperationalError
import os
import json

from models import db, User

def create_app():
    app = Flask(__name__)
    app.config.from_object('config.dev')
    db.init_app(app)
    return app

app = create_app()
app.app_context().push()
jwt = JWTManager(app)

@app.route("/", methods=["GET"])
def homepage():
    return "Hello World!"


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
            if len(filteredUsername) < 5:
                return json.dumps({"error" : "Username too short!"})
            
            if registrationData["password"] != registrationData["confirmPassword"]:
                return json.dumps({"error" : "Passwords do not match!"})
            
            if len(registrationData["password"]) < 6:
                return json.dumps({"error" : "Password is too short!"})

            try:
                newUser = User(filteredUsername, registrationData["password"])
                db.session.add(newUser)
                db.session.commit()
                return json.dumps({"msg" : "Sucesssfully registered!"})
            except IntegrityError:
                db.session.rollback()
                return json.dumps({"error" : "This user already exists!"})
            except OperationalError:
                print("Database not initialized!")
                return json.dumps({"error" : "Database has not been initialized! Please contact the administrator of the application!"})
            except:
                return json.dumps({"error" : "An unknown error has occurred!"})

    return json.dumps({"error" : "Invalid registration details supplied!"})

@app.route("/identify", methods=["GET"])
@jwt_required()
def identify():
    return json.dumps(get_jwt_identity())

if __name__ == "__main__":
    print('Application running in ' + app.config['ENV'] + ' mode!')
    app.run(host='0.0.0.0', port = 8080, debug = app.config['ENV']=='development')
