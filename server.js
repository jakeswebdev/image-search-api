const express = require('express');
const dotenv = require('dotenv').config();
const https = require('https');
const mongo = require('mongodb').MongoClient;
const app = express();
const moment = require('moment');
let gUri = 'https://www.googleapis.com/customsearch/v1?key=' + process.env.GKEY + '&cx=' + process.env.CX + '&searchType=image' ;
let dbUri = 'mongodb://' + process.env.DBUSER + ':' + process.env.DBPASS + '@ds113200.mlab.com:13200/search-term-db';

mongo.connect(dbUri,function(err,database){
    const myDB = database.db('search-term-db');
    const collection = myDB.collection('search-collection');
    if(err){
        console.log('cant connect to db');
    }    
    app.get('/search/:imgstr*',function(request,response){
        let imagestring = request.params.imgstr;
        let searchUri = gUri + '&q=' + imagestring;
        let searchDate = moment().utc().format('MMM DD h:mm A');
        collection.insert({
            'search-term':imagestring,
            'date':searchDate
        },function(error,data){
            if(error){
                console.log('could not add search param to db');
            }
        });
        https.get(searchUri,function(res){
            let dataFromResponse = '';        

            res.on('data',function(chunk){
                dataFromResponse += chunk;
            });

            res.on('end',function(){
                let newJson = []
                let parsedData = JSON.parse(dataFromResponse).items;
                for(let i = 0;i<parsedData.length;i++){
                    newJson.push({"snippet" : parsedData[i].title, "url":parsedData[i].link,"thumbnail":parsedData[i].image.thumbnailLink,"context": parsedData[i].image.contextLink})
                }
                response.send(newJson);
                
            });
        }).on('error',function(err){
            console.log("error: "+ err.message);
        })

    });
    app.get('/recent',function(request,response){
        collection.find().sort({_id :-1}).limit(10).toArray(function(err,data){
            if(err){
                console.log('cant sort db documents');
            }
            let dataJson = data.filter(function(elements){
                delete elements._id;
                return true;
            });
            response.json(dataJson);
        })
    });
    app.get('/',function(request,response){
        response.sendFile(path.join(__dirname + '/index.html'));
    })
})



app.listen(3000,function(){
    console.log('server working');
})

/*
GET https://www.googleapis.com/customsearch/v1?key=INSERT_YOUR_API_KEY&cx=017576662512468239146:omuauf_lfve&q=lectures
'https://www.googleapis.com/customsearch/v1?key=' + process.env.GKEY + '&cx=' + process.env.CX + '&q=lectures'
*/