let fs = require("fs")
let request = require("request")
let cheerio = require("cheerio")
const {jsPDF} = require("jspdf")
let data={}


function saveIssues(body,path,pname,topicName)
{   
    let obj ={}
    var doc = new jsPDF();
    let flag=false
    doc.setFontSize(10)
    $=cheerio.load(body)
    let idx = data[topicName].findIndex(function(e){
        return e.projectName==pname
    })
    let issue = $('.Link--primary.v-align-middle.no-underline.h4.js-navigation-open')
    for(let i=0; i<issue.length; ++i)
    {   flag=true;
        let issueName = $(issue[i]).text().trim()
        let issueURL= "https://github.com"+$(issue[i]).attr('href')
        if(!data[topicName][idx].issues)
            data[topicName][idx].issues=[{issueName,issueURL}]
        else
            data[topicName][idx].issues.push({issueName,issueURL})
        doc.setFont('Helvetica','bold')
        doc.setTextColor("black")
        doc.text( issueName, 10, 10 + 15*i)
        doc.setFont('Helvetica','normal')
        doc.setTextColor("blue")
        doc.text( issueURL, 10, 15 + 15*i)
    }
    fs.writeFileSync("data.json",JSON.stringify(data))
    if(flag)
        doc.save(path+"\\"+pname+".pdf");

}
function accessIssues(body,path,topicName)
{
    $=cheerio.load(body)
    let issueLink = $($('.js-selected-navigation-item.UnderlineNav-item.hx_underlinenav-item.no-wrap.js-responsive-underlinenav-item')[1])
    let pname = $('.mr-2.flex-self-stretch>a').text().trim()
    request("https://github.com/"+issueLink.attr('href'),function(err, res, body){
            if(!err)
                saveIssues(body,path,pname,topicName)
        });
}
function getProjects(body,path,topicName)
{
    $=cheerio.load(body)
    let pname = $('.f3.color-text-secondary.text-normal.lh-condensed .text-bold');
    if(pname.length>8)
        pname=pname.slice(0,8);
    for(let i=0; i<pname.length; ++i)
    {   let projectName=$(pname[i]).text().trim();
        let projectURL = "https://github.com/"+$(pname[i]).attr('href')
        if(!data[topicName])
            data[topicName]=[{projectName,projectURL}]
        else
            data[topicName].push({projectName,projectURL})
        request(projectURL,function(err, res, body){
            if(!err)
            accessIssues(body,path,topicName)
        });
    }    
}
function accessTopic(url,topicName)
{   
    let dirPath = process.cwd()+"\\"+topicName
    fs.mkdir(dirPath, function(err){ 
        if (err)
            return console.error(err); 
    }); 
    request(url, function(err,res,body){
        if(!err)
            getProjects(body,dirPath,topicName)
    });
}
function responseHandler(err, res, body)
{
    if(!err)
    {
        html=cheerio.load(body)
        let links = html('.no-underline.d-flex.flex-column.flex-justify-center')
        let name = html('.f3.lh-condensed.text-center.Link--primary.mb-0.mt-1')
        
        for(let i=0; i<links.length; ++i)
        {
            accessTopic("https://github.com/"+html(links[i]).attr('href'),html(name[i]).text().trim())
        }
    }
    
}
request("https://github.com/topics", responseHandler)
