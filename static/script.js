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
    
    identifyUser()

    window.location = `/web`
}

async function identifyUser(){
    let user = await sendRequest("/identify", "GET")

    let userStateArea = document.querySelector("#userStateArea");
    let mainTabArea = document.querySelector("#mainTab");
    let welcomeBanner = document.querySelector("#welcomeBanner");

    if("username" in user){
        userStateArea.innerHTML = `<a class="nav-link" href="#" onclick="logout()">Logout</a>`
        mainTabArea.innerHTML = `<li class="nav-item" role="presentation">
                                    <a class="nav-link active" id="mainTab-home-tab" data-bs-toggle="pill" data-bs-target="#mainTab-home" type="button" role="tab">Home</a>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <a class="nav-link" id="mainTab-profile-tab" data-bs-toggle="pill" data-bs-target="#mainTab-profile" type="button" role="tab">Profile</a>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <a class="nav-link" id="mainTab-contact-tab" data-bs-toggle="pill" data-bs-target="#mainTab-contact" type="button" role="tab">Contact</a>
                                </li>`
        welcomeBanner.innerHTML = ` <h1 class="display-4">Welcome back, ${user["username"]}!</h1>
                                    <p class="lead">As a logged in user, you are able to enroll within a semester, add courses to the semester, and add marks for the enrolled courses. The semester GPA and grades will be automatically calculated from the presented course marks.</p>
                                    <hr class="my-4">
                                    <a class="btn btn-primary btn-lg" href="#" role="button">Learn more</a>`
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


function main(){
    identifyUser()
}


window.addEventListener('DOMContentLoaded', main);