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
                                    <p class="lead">This is a simple hero unit, a simple jumbotron-style component for calling extra attention to featured content or information.</p>
                                    <hr class="my-4">
                                    <p>It uses utility classes for typography and spacing to space content out within the larger container.</p>
                                    <p class="lead">
                                    <a class="btn btn-primary btn-lg" href="#" role="button">Learn more</a>`
    } else {
        userStateArea.innerHTML = `<a class="nav-link" href="#" data-bs-toggle="modal" data-bs-target="#userStateAction">Login/Register</a>`
        mainTabArea.innerHTML = ``
        welcomeBanner.innerHTML = ` <h1 class="display-4">Not logged in!</h1>
                                    <p class="lead">This is a simple hero unit, a simple jumbotron-style component for calling extra attention to featured content or information.</p>
                                    <hr class="my-4">
                                    <p>It uses utility classes for typography and spacing to space content out within the larger container.</p>
                                    <p class="lead">
                                    <a class="btn btn-success btn-lg" data-bs-toggle="modal" data-bs-target="#userStateAction">Login/Register</a>`
    }

}


function main(){
    identifyUser()
}


window.addEventListener('DOMContentLoaded', main);