let fs = require("fs")
let request = require("request")
let cheerio = require("cheerio")

function saveIssues(body,path,pname)
{   
    let obj ={}
    $=cheerio.load(body)
    let issue = $('.Link--primary.v-align-middle.no-underline.h4.js-navigation-open')
    for(let i=0; i<issue.length; ++i)
        obj[$(issue[i]).text().trim()]="https://github.com"+$(issue[i]).attr('href')
    fs.writeFileSync(path+"\\"+pname+".json",JSON.stringify(obj))
}
function accessIssues(body,path)
{
    $=cheerio.load(body)
    let issueLink = $($('.js-selected-navigation-item.UnderlineNav-item.hx_underlinenav-item.no-wrap.js-responsive-underlinenav-item')[1])
    let pname = $('.mr-2.flex-self-stretch>a').text().trim()
    request("https://github.com/"+issueLink.attr('href'),function(err, res, body){
            if(!err)
                saveIssues(body,path,pname)
        });
}
function accessProjects(body,path)
{
    $=cheerio.load(body)
    let pname = $('.f3.color-text-secondary.text-normal.lh-condensed>a.text-bold');
    for(let i=0; i<pname.length; ++i)
    {
        request("https://github.com/"+$(pname[i]).attr('href'),function(err, res, body){
            if(!err)
                accessIssues(body,path)
        });
    }
        
}
function accessTopic(url,name)
{   
    let dirPath = process.cwd()+"\\"+name
    fs.mkdir(dirPath, function(err){ 
        if (err)
            return console.error(err); 
    }); 
    request(url, function(err,res,body){
        if(!err)
            accessProjects(body,dirPath)
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