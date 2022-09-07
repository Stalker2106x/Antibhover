import Config from '../config.json';
const axios = require('axios');

async function queryMetar(ICAO:string) : Promise<string>  {
    let res:any = await axios.get(Config.metar.apiUrl+"/metar/"+ICAO, {
        headers: {'Authorization': 'BEARER '+Config.metar.apiKey}
    });
    return (parseMetar(res.data.raw));
}

function parseMetar(rawMetar:string):any {
    let metarData = rawMetar.split(' ');
    console.log(metarData)
    let metar:any = {
        trend: "TEND",
        runawayVisRange: "",
        weather: "",
        clouds: ""
    };
    let step = 0;

    metar.raw = rawMetar;
    //Identification
    if (metarData[step] == "METAR" || metarData[step] == "SPECI") metar.messageType = metarData[step++];
    metar.icao = metarData[step++];
    metar.timestamp = metarData[step++];
    if (metarData[step] == "AUTO" || metarData[step] == "COR") metar.messageOption = metarData[step++];
    //Wind
    metar.wind = metarData[step++];
    if (/^[0-9V]+$/.test(metarData[step]) && metarData[step].includes("V")) metar.windVariant = metarData[step++];
    //VisibilityDom
    metar.visibility = metarData[step++];
    //CAVOK ?
    if (metar.visibility != "CAVOK") {
        if (/^[0-9NSEW]+$/.test(metarData[step])) metar.visibility += ' '+metarData[step++];
        //RunawayVisRange
        if (metarData[step].includes("/") && metarData[step].startsWith("R")) metar.runawayVisRange = "";
        while (metarData[step].includes("/") && metarData[step].startsWith("R")) {
            metar.runawayVisRange += metarData[step++] + ' ';
        }
        //Weather
        if (/^[A-Z+-]+$/.test(metarData[step])) metar.weather = metarData[step++];
        //Clouds
        metar.clouds = [metarData[step++]];
        while (!metarData[step].includes("/")) metar.clouds.push(metarData[step++]);
    }
    //Temperature
    metar.temperature = metarData[step++];
    //Pressure
    metar.pressure = metarData[step++];
    if (step >= metarData.length) return (metar);
    //Complimentary
    if (metarData[step].startsWith("RE")) metar.complimentary = metarData[step++];
    //Trend
    metar.trend = metarData[step++];
    //Weather
    if (/^[A-Z+-]+$/.test(metarData[step])) metar.weather = metarData[step++];
    return (metar)
}

function checkRule(ruleName:string, value:any) : number {
    let score = 0;
    if (ruleName == "Visibility") {
       if (value < Config.metar.rules.visibility) score = -1;
    }
    else if (ruleName == "Wind") {
       if (Config.metar.rules.windOrientation.includes(windDirection(value.orientation)) && value.strength > Config.metar.rules.windStrength) {
            score = -1;
        }
    }
    else if (ruleName == "Clouds") {
        for (const cloud in value) {
            if (value.height < Config.metar.rules.cloudsHeight) score = -1;
        }
    }
    return (score);
}

function scoreToVariant(value:number) : string {
    if (value == 0) return ("success");
    else return ("danger");
}

function windDirection(value:number) : string {
    if (value >= 11.25 && value <= 56.25) return ("NE");
    else if (value > 56.25 && value <= 101.25) return ("E");
    else if (value > 101.25 && value <= 146.25) return ("SE");
    else if (value > 146.25 && value <= 191.25) return ("S");
    else if (value > 191.25 && value <= 236.25) return ("SW");
    else if (value > 236.25 && value <= 281.25) return ("W");
    else if (value > 281.25 && value <= 326.25) return ("NW");
    else return ("N");
}

export { queryMetar, checkRule, scoreToVariant, windDirection};