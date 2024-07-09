function format_word(word){
    let new_word = "";
    for(var i in word){
        let letter = word[i];
        if(i != 0 && ((letter.toLowerCase() != letter.toUpperCase()) || ":/.,'!@#$%^&*()-_+=".includes(letter))){
            letter = letter.toLowerCase();
            new_word += letter;
        }else{
            new_word += letter;
        }
    }
    return new_word;
}

function format_title(title) {

    var new_title = "";
  
    for (var word of title.split(" ")) {
      new_title += (format_word(word) + " ");
    }
  
    return new_title.trim(); 
}
function extractIdentifier(url) {
    const regex = /\/alma\/(\d+)\/catalog/;
    const match = url.match(regex);
    if (match && match[1]) {
        return match[1];
    } else {
        return null;
    }
}
function extract_title(obj){
    var title = [];
    obj = obj['titleInfo'];
    try{
        for(var item of obj){
            if("title" in item && "@type" in item == false){
                var l = item['title'];
                if('subTitle' in item){
                    l = (l+": "+item['subTitle']);
                }
                title.push(l);
            }else if("@type" in item){
                if(item["@type"] == "alternative"){
                    title.push(item["title"]);
                }
            }else{
                title.push(item["title"]);
            }
            
        }
    }catch{
            if("title" in obj && "@type" in obj == false){
                var l = obj['title'];
                if('subTitle' in obj){
                    l = (l+": "+obj['subTitle']);
                }
                title.push(l);
            }else if("@type" in obj){
                if(obj["@type"] == "alternative"){
                    title.push(obj["title"]);
                }
            }else{
                title.push(obj['title']);
            }

    }
    return title;
}

function extract_identifiers(json){
    let data = json['identifier'];
    // console.log(typeof data);
    var ids = {};
    // console.log(data);
    try{
        for(var obj of data){
            let key = obj['@type']
            let value = obj['#text']
            var r = [];
            if(key in ids){
                r = ids[key];
            }
            r.push(value);
            ids[key] = r;
        }
    }catch{
        let i = 1;
    }
    return ids;
}

function extract_genre(json){
    return json['genre']['#text'];
}

function extract_hollis_id(json){
    try{
        for(var poss of json['relatedItem']){
            if(poss['@otherType'] == 'HOLLIS record'){
                return extractIdentifier(poss['location']['url']);
            }
        }
    }catch{
        try{
            return extractIdentifier(json['relatedItem']['location']['url'])
        }catch{
            return null;
        }
    }
    return null;
}

function extract_subject(json){
    let subs = [];
    try{
        for(var obj of json['subject']){
            subs.push(obj['topic']);
        }
    }catch{
        try{
            subs.push(json['subject']);
        }catch{
            let i = 1;;
        }
    }
    return subs;
}

function extract_origin_info(json){
    
    let Associations = []
    let Origin = {};
    if('name' in json){
        let Name = json['name'];
        try{
            for(var n of Name){
                if(n["@type"] == "personal"){
                    let author = n['namePart'][0]
                    let ath = []
                    ath.push(author);
                    let f_ath = author.split(", ");
                    ath.push(f_ath[0] + " " + f_ath[1])
                    Origin['Author'] = ath;
                }else{
                    Associations.push(n['namePart']);
                }
            }
        }catch{
            let n = json['name'];
            let author = n['namePart'][0];
            let ath = []
            ath.push(author);
            let f_ath = author.split(", ");
            ath.push((f_ath[1] + " " + f_ath[0]))
            Origin['Author'] = ath;
            Associations.push(n['namePart']);
        }
        Origin['Associations'] = Associations;
    }


    try{
        for(var n of json['language']['languageTerm']){
            if(n['@type'] == 'text'){
                Origin['language'] = n['#text'];
            }
        }
    }catch{
        Origin['language'] = json['language']['languageTerm'];
    }
    let or = json["originInfo"];
    Origin["Publisher"] = or['publisher'];
    try{
        for(var obj of or['place']){
            if(obj['placeTerm'].constructor === Array){
                for(var obj2 of obj['placeTerm']){
                    if(obj2['@type'] == 'text'){
                        Origin['Location'] = obj2['#text'];
                    }
                }
            }else{
                Origin['Location'] = obj2['#text'];
            }
        }
    }catch{
        Origin['location'] = or['place'];
    }
    return Origin;
}

class HOBJECT {
    Hobject(json){
        this.process(json);
    }
    check_author(name){
        return name in this.origin['Author'];
    }
    authorName(){
        
    }
    pubName(){
        return this.origin['Publisher'];
    }
    check_creators(cr){
        try{
            return (this.origin['Publisher'].includes(cr)) || (this.origin['Author'].includes(cr)) || (this.origin['Associations'].includes(cr));
        }catch{
            return false;
        }
    }
    process(json){

        this.titles = extract_title(json);
        this.identifiers = extract_identifiers(json);
        this.hollisID = extract_hollis_id(json);
        this.subject = extract_subject(json);
        this.origin = extract_origin_info(json);
    }
    check_identifier(type,id){
        if(!(type in this.identifiers)){
            return this.asList().includes(id);
        }else{
            return (this.asList().includes(id) || type in this.identifiers);
        }
        
    }
    display(){
        console.log("Titles: ",this.titles );
        console.log("Identifiers: ",this.identifiers);
        console.log("Origin: ",this.origin);
        console.log("Subject: ",this.subject);
    }
    asList(){
        var L = []
        for (var title of this.titles) {
            if (title!== undefined) {
              L.push(title);
            }
          }

          for (var id in this.identifiers) {
            if (this.identifiers[id]!== undefined) {
              L = L.concat(this.identifiers[id]);
            }
          }
          
          for (var sub of this.subject) {
            if (sub!== undefined) {
              try{
                L.concat(sub['topic']);
              }catch{
                L.push(sub);
              }
            }
          }
          
          for (var or in this.origin) {
            if (this.origin[or]!== undefined) {
              try{
                L = L.concat(this.origin[or]);
              }catch{
                L.push(this.origin[or]);
              }
            }
          }
          
          if (this.genre!== undefined) {
            L.push(this.genre);
          }

        return L;

    }
}
export default HOBJECT;