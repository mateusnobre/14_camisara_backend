import app from './ServerApp.js';

function get_port(){
    if(process.env.PORT){
        return process.env.PORT
    }
    else {
        return 4000
    }
}

app.listen(get_port(), () => {
    console.log("Server running on port " + get_port());
});