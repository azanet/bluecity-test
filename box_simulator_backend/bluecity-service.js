const Service = require('node-windows').Service

console.log(__filename)

const svc = new Service({
    name: "bluecityService",
    description: "bluecity box_simulator_backend service",
    script: "D:\\Casa\\bluecity-test-last\\bluecity-test\\box_simulator_backend\\server.js"
})

svc.on('install', function(){
    svc.start()
})

svc.install()

//To create the service
//node bluecity-service.js

//To delete a windows service
//sc delete "bluecityService.exe"