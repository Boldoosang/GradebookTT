async function sendRequest(url, method, data){
    try {
        let access_token = window.localStorage.getItem("access_token");

        let request = {
            "method" : method,
            "headers" : {
                "Authorization" : `Bearer ${access_token}`
            }
        }

        if (data){
            request = {
                "method" : method,
                "headers" : {
                    "Authorization" : `Bearer ${access_token}`,
                    "Content-Type" : "application/json"
                }
            }
            request.body = JSON.stringify(data);
        }


        let response = await fetch(url, request);
        let results = await response.json()

        return results;
    } catch (e){
        console.log(e)
        return {"error" : "An unexpected error has occurred!"};
    }
}


async function login(event){
    event.preventDefault();

    let form = event.target;

    let loginDetails = {
        "username" : form.elements["username"].value,
        "password" : form.elements["password"].value
    }

    form.reset();

    let result = await sendRequest("/login", "POST", loginDetails);
    let messageArea = document.querySelector("#userActionMessage")

    if("error" in result){
        messageArea.innerHTML = `<b class="text-danger text-center">${result["error"]}</b>`
    } else {
        window.localStorage.setItem("access_token", result["access_token"]);
        messageArea.innerHTML = `<b class="text-success text-center">Login successful!</b>`
        window.location = "/web"
    }
}

function logout(){
    accessToken = window.localStorage.getItem("access_token");

    if(accessToken){
        window.localStorage.removeItem('access_token');
        console.log("Succesfully logged out!")
    } else 
        console.log("You were not logged in!")
    
    identifyUserContext()

    window.location = `/web`
}

async function identifyUser(){
    let user = await sendRequest("/identify", "GET")

    if("username" in user){
        return user;
    } else {
        return {"error" : "User is not logged in or session has expired!"}
    }
}

async function identifyUserContext(){
    let user = await identifyUser();

    let userStateArea = document.querySelector("#userStateArea");
    let mainTabArea = document.querySelector("#mainTab");
    let welcomeBanner = document.querySelector("#welcomeBanner");

    if("username" in user){
        userStateArea.innerHTML = `<a class="nav-link" href="#" onclick="logout()">Logout</a>`
        mainTabArea.innerHTML = `<li class="nav-item" role="presentation">
                                    <a class="nav-link active" id="mainTab-home-tab" data-bs-toggle="pill" data-bs-target="#mainTab-home" type="button" role="tab">Home</a>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <a class="nav-link" onclick="profileHandler()" id="mainTab-profile-tab" data-bs-toggle="pill" data-bs-target="#mainTab-profile" type="button" role="tab">Profile</a>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <a class="nav-link" id="mainTab-grades-tab" data-bs-toggle="pill" data-bs-target="#mainTab-grades" type="button" role="tab">Grades</a>
                                </li>`
        welcomeBanner.innerHTML = ` <h1 class="display-4">Welcome back, ${user["username"]}!</h1>
                                    <p class="lead">As a logged in user, you are able to enroll within a semester, add courses to the semester, and add marks for the enrolled courses. The semester GPA and grades will be automatically calculated from the presented course marks.</p>`
    } else {
        userStateArea.innerHTML = `<a class="nav-link" href="#" data-bs-toggle="modal" data-bs-target="#userStateAction">Login/Register</a>`
        mainTabArea.innerHTML = ``
        welcomeBanner.innerHTML = ` <h1 class="display-4">Not logged in!</h1>
                                    <p class="lead">Please log in to continue using the application. If you do not have an account, feel free to make one using the provided button.</p>
                                    <p class="lead">GradebookTT is an application designed to help students keep track of their semester marks and respective GPAs for that semester. It provides the necessary tools for students to enroll in a semester, add their semester courses, and add the attained marks for their semester courses. Calculations will be automatically performed by the system to determine the student's performance and grades.</p>
                                    <hr class="my-4">
                                    <a class="btn btn-primary btn-lg mb-3" data-bs-toggle="modal" data-bs-target="#userStateAction">Login/Register</a>`
    }

}

async function register(event){
    event.preventDefault();

    let form = event.target;

    let registrationDetails = {
        "username" : form.elements["username"].value,
        "password" : form.elements["password"].value,
        "confirmPassword" : form.elements["confirmPassword"].value
    }

    form.reset();

    let result = await sendRequest("/register", "POST", registrationDetails);
    let messageArea = document.querySelector("#userActionMessage")

    if("error" in result){
        messageArea.innerHTML = `<b class="text-danger text-center">${result["error"]}</b>`
    } else {
        messageArea.innerHTML = `<b class="text-success text-center">Registration successful!</b>`
    }

}

async function profileHandler(){
    let user = await identifyUser();
    let profileContent = document.querySelector("#profileContent")
    console.log(profileContent)
    console.log(user)

    if("error" in user){
        profileContent.innerHTML = `<div class="text-center text-white">
                                    <h2>User is not logged in!</h2>
                                    <p>${user["error"]}</p></div>`
    } else {
        profileContent.innerHTML = `
                    <h1>My Profile</h1>
                    <hr class="my-3">
                    
                    <div class="form-group my-3">
                        <label for="profile-username">Current Username</label>
                        <input type="text" class="form-control mt-2" id="profile-username" readonly disabled>
                    </div>

                    <div class="form-group my-3">
                        <label for="profile-universityName">Current University Grading Scheme</label>
                        <input type="text" class="form-control mt-2" id="profile-universityName" readonly disabled>
                    </div>

                    <a class="btn btn-primary w-100" data-bs-toggle="collapse" href="#changePasswordArea" role="button">
                        Change Password
                    </a>
                    
                    <div class="collapse mb-5" id="changePasswordArea">
                        <div class="card card-body bg-dark mt-3 border border-danger rounded">
                            <form onsubmit="changePassword(event)">
                                <div class="form-group my-3">
                                <label for="changePassword-oldPassword">Old Password</label>
                                <input type="password" class="form-control mt-2" name="oldPassword" id="changePassword-oldPassword" placeholder="Old Password" required>
                                </div>
                                <div class="form-group my-3">
                                <label for="changePassword-newPassword">Password</label>
                                <input type="password" class="form-control mt-2" name="password" id="changePassword-newPassword" placeholder="Password" required>
                                </div>
                                <div class="form-group my-3">
                                    <label for="changePassword-confirmPassword">Confirm Password</label>
                                    <input type="password" class="form-control mt-2" name="confirmPassword" id="changePassword-confirmPassword" placeholder="Confirm Password" required>
                                </div>
                                <span id="updatePasswordMessage"></span>
                                <button type="submit" class="float-end btn btn-danger mt-2">Change Password</button>
                            </form>
                        </div>
                    </div>

                    <a class="btn btn-primary w-100 my-2" data-bs-toggle="collapse" href="#changeUniversityArea" role="button">
                        Update University
                    </a>

                    <div class="collapse mb-5" id="changeUniversityArea">
                        <div class="card card-body bg-dark mt-3 border border-danger rounded">
                            <form onsubmit="updateUniversity(event)">
                                <div class="form-group my-3">
                                    <label for="updateUniversity-universityName">University</label>
                                    <select name="universityName" class="form-control mt-2" id="updateUniversity-universityName" required>
                                        <option>University of the West Indies</option>
                                        <option>4.0 GPA University</option>
                                    </select>
                                </div>
                                <span id="updateUniversityMessage"></span>
                                <button type="submit" class="float-end btn btn-danger mt-2">Update University</button>
                            </form>
                        </div>
                    </div>
                </div>`

        let usernameArea = document.querySelector("#profile-username")
        let universityArea = document.querySelector("#profile-universityName")
        usernameArea.setAttribute("placeholder", user.username)
        universityArea.setAttribute("placeholder", user.universityName)
    }
}

async function changePassword(event){
    event.preventDefault()

    let form = event.target;

    let newPasswordDetails = {
        "oldPassword" : form.elements["oldPassword"].value,
        "password" : form.elements["password"].value,
        "confirmPassword" : form.elements["confirmPassword"].value
    }

    form.reset();

    let result = await sendRequest("/profile/password", "PUT", newPasswordDetails);
    let messageArea = document.querySelector("#updatePasswordMessage")

    if("error" in result){
        messageArea.innerHTML = `<b class="text-danger text-center">${result["error"]}</b>`
    } else {
        messageArea.innerHTML = `<b class="text-success text-center">Password updated successfully!</b>`
    }

}

async function updateUniversity(event){
    event.preventDefault()

    let form = event.target;

    let updatedUniversityDetails = {
        "universityName" : form.elements["universityName"].value,
    }

    form.reset();

    let result = await sendRequest("/profile/university", "PUT", updatedUniversityDetails);
    let messageArea = document.querySelector("#updateUniversityMessage")

    if("error" in result){
        messageArea.innerHTML = `<b class="text-danger text-center">${result["error"]}</b>`
    } else {
        messageArea.innerHTML = `<b class="text-success text-center">University updated successfully!</b>`
    }
    
}


function main(){
    identifyUserContext()
}


window.addEventListener('DOMContentLoaded', main);