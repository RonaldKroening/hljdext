class HOBJECT {
    constructor(json) {
        this.process(json);
    }

    check_author(name) {
        return this.origin['Author'] && this.origin['Author'].includes(name);
    }

    authorName() {
        return this.origin['Author'];
    }

    pubName() {
        return this.origin['Publisher'];
    }

    check_creators(cr) {
        try {
            return (this.origin['Publisher'].includes(cr)) || (this.origin['Author'] && this.origin['Author'].includes(cr)) || (this.origin['Associations'] && this.origin['Associations'].includes(cr));
        } catch {
            return false;
        }
    }

    process(json) {
        this.titles = extract_title(json) || [];
        this.identifiers = extract_identifiers(json) || [];
        this.hollisID = extract_hollis_id(json) || "";
        this.subject = extract_subject(json) || [];
        this.origin = extract_origin_info(json) || {};
    }
    

    check_identifier(type, id) {
        // console.log(this.identifiers);
        for(const pair of this.identifiers){
            // console.log("Entries: ",Object.entries(pair));
            for(const [key,val] of Object.entries(pair)){
                console.log(`Comparing ${id} with ${val}`);
                console.log(`Key: ${key} Type: ${type} and ${key === type} and ${val.toString() === id.toString()}`)
                if(key === type){
                    if(val.toString() === id.toString()){
                        console.log("MATCH FOUND!");
                        return true;
                    }
                }
            }
        }
        return false;
    }

    display() {
        console.log("Titles: ", this.titles);
        console.log("Identifiers: ", this.identifiers);
        console.log("Origin: ", this.origin);
        console.log("Subject: ", this.subject);
    }

    asList() {
        let L = [];

        if (Array.isArray(this.titles)) {
            for (let title of this.titles) {
                if (title !== undefined) {
                    L.push(title);
                }
            }
        }
        for(const pair of this.identifiers){
            for(const [key,val] of Object.entries(pair)){
                L.push(val);
            }
        }
        
        for (let id in this.identifiers) {
            if (this.identifiers[id] !== undefined) {
                L = L.concat(this.identifiers[id]);
            }
        }

        if (Array.isArray(this.subject)) {
            for (let sub of this.subject) {
                if (sub !== undefined) {
                    try {
                        L = L.concat(sub['topic']);
                    } catch {
                        L.push(sub);
                    }
                }
            }
        }

        for (let or in this.origin) {
            if (this.origin[or] !== undefined) {
                try {
                    L = L.concat(this.origin[or]);
                } catch {
                    L.push(this.origin[or]);
                }
            }
        }

        if (this.genre !== undefined) {
            L.push(this.genre);
        }

        return L;
    }
}



function extract_origin_info(json) {
    let Associations = [];
    let Origin = {};

    if ('name' in json) {
        let Name = json['name'];
        try {
            for (let n of Name) {
                if (n["@type"] == "personal") {
                    let author = Array.isArray(n['namePart']) ? n['namePart'][0] : n['namePart'];
                    let ath = [];
                    ath.push(author);
                    let f_ath = author.split(", ");
                    ath.push(f_ath[0] + " " + f_ath[1]);
                    Origin['Author'] = ath;
                } else {
                    Associations.push(n['namePart']);
                }
            }
        } catch {
            let n = json['name'];
            let author = Array.isArray(n['namePart']) ? n['namePart'][0] : n['namePart'];
            let ath = [];
            ath.push(author);
            let f_ath = author.split(", ");
            ath.push((f_ath[1] + " " + f_ath[0]));
            Origin['Author'] = ath;
            Associations.push(n['namePart']);
        }
        Origin['Associations'] = Associations;
    }

    try {
        if (json['language'] && json['language']['languageTerm']) {
            let languageTerm = json['language']['languageTerm'];
            if (Array.isArray(languageTerm)) {
                for (let n of languageTerm) {
                    if (n['@type'] == 'text') {
                        Origin['language'] = n['#text'];
                    }
                }
            } else if (languageTerm['@type'] == 'text') {
                Origin['language'] = languageTerm['#text'];
            }
        }
    } catch {
        Origin['language'] = "Unknown";
    }

    // Process originInfo
    if (json["originInfo"] && Array.isArray(json["originInfo"])) {
        let or = json["originInfo"][0];
        if (or) {
            Origin["Publisher"] = or['publisher'] || "Unknown";

            try {
                if (or['place']) {
                    for (let obj of or['place']) {
                        if (obj['placeTerm']) {
                            if (Array.isArray(obj['placeTerm'])) {
                                for (let obj2 of obj['placeTerm']) {
                                    if (obj2['@type'] == 'text') {
                                        Origin['Location'] = obj2['#text'];
                                    }
                                }
                            } else if (obj['placeTerm']['@type'] == 'text') {
                                Origin['Location'] = obj['placeTerm']['#text'];
                            }
                        }
                    }
                }
            } catch {
                Origin['Location'] = "Unknown";
            }
        } else {
            Origin["Publisher"] = "Unknown";
            Origin["Location"] = "Unknown";
        }
    } else {
        Origin["Publisher"] = "Unknown";
        Origin["Location"] = "Unknown";
    }

    return Origin;
}

// Helper functions
function format_word(word) {
    let new_word = "";
    for (let i in word) {
        let letter = word[i];
        if (i != 0 && ((letter.toLowerCase() != letter.toUpperCase()) || ":/.,'!@#$%^&*()-_+=".includes(letter))) {
            letter = letter.toLowerCase();
            new_word += letter;
        } else {
            new_word += letter;
        }
    }
    return new_word;
}

function format_title(title) {
    let new_title = "";
    for (let word of title.split(" ")) {
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

function extract_title(obj) {
    let title = [];
    if (obj && obj['titleInfo']) {
        try {
            for (let item of obj['titleInfo']) {
                if ("title" in item && !("@type" in item)) {
                    let l = item['title'];
                    if ('subTitle' in item) {
                        l = (l + ": " + item['subTitle']);
                    }
                    title.push(l);
                } else if ("@type" in item) {
                    if (item["@type"] == "alternative") {
                        title.push(item["title"]);
                    }
                }
            }
        } catch {
            if ("title" in obj && !("@type" in obj)) {
                let l = obj['title'];
                if ('subTitle' in obj) {
                    l = (l + ": " + obj['subTitle']);
                }
                title.push(l);
            } else if ("@type" in obj) {
                if (obj["@type"] == "alternative") {
                    title.push(obj["title"]);
                }
            }
        }
    }
    return title;
}

function extract_identifiers(json) {
    let data = json['identifier'];
    let ids = [];
    try {
        if (Array.isArray(data)) {
            for (let obj of data) {
                if (obj.hasOwnProperty('@type') && obj.hasOwnProperty('#text')) {
                    let key = obj['@type'].toString();
                    // console.log(`Key added: ${key}`);
                    let value = obj['#text'].toString();
                    let r = {};
                    r[key] = value;
                    ids.push(r);
                }
            }
        } else {
            console.log("Data is not an array");
        }
    } catch (error) {
        console.error("An error occurred:", error);
    }
    console.log("IDs:", ids);
    return ids;
}

function extract_genre(json) {
    return json['genre'] && json['genre'][0] && json['genre'][0]['#text'];
}

function extract_hollis_id(json) {
    json = JSON.stringify(json);

    const regex = /https:\/\/id\.lib\.harvard\.edu\/alma\/[0-9]+\/catalog/i;

    let match = json.match(regex);
    if (match) {
        match = match[0];
        match = match.replace("/catalog", "");
        match = match.replace("https://id.lib.harvard.edu/alma/", "");
        return match;
    } else {
        return ["Yellow: None Found"];
    }
}

function extract_subject(json) {
    let subs = [];
    try {
        for (let obj of json['subject']) {
            subs.push(obj['topic']);
        }
    } catch {
        try {
            subs.push(json['subject']);
        } catch {
            // handle error if needed
        }
    }
    return subs;
}

export default HOBJECT;
