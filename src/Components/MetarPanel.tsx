import React from 'react';
import moment from 'moment';
import Card from 'react-bootstrap/Card';
import Alert from 'react-bootstrap/Alert';
import InputGroup from 'react-bootstrap/InputGroup';
import Config from '../config.json';
import { queryMetar, checkRule, scoreToVariant, windDirection } from '../Helpers/Query';

const WeatherCodes:any = {
    "SHRA": {"msg": "Rain showers", "variant": "danger"},
    "SHRASN": {"msg": "Rain and snow showers", "variant": "danger"},
    "SHSN": {"msg": "Snow showers", "variant": "danger"},
    "GR": {"msg": "Showers with hail, not with thunder", "variant": "danger"}
}

const CloudCodes:any = {
    "SKC": {"msg": "Sky clear (0 octa)", "octas": 0},
    "FEW": {"msg": "Few clouds (1 to 2 octas)", "octas": 2},
    "SCT": {"msg": "Scattered clouds (3 to 4 octas)", "octas": 4},
    "BKN": {"msg": "Broken clouds (5 à 7 octas)", "octas": 6},
    "OVC": {"msg": "Overcast clouds, sky covered (8 octas)", "octas": 8},
    "NSC": {"msg": "No clouds under 5 000 ft", "octas": 0}
}

const TrendCodes:any = {
    "NOSIG" : {"msg": "No significant change in the next two hours", "variant": "success"},
    "BECMG" : {"msg": "Becoming", "variant": "warning"},
    "GRADU" : {"msg": "changements prévus qui va arriver progressivement", "variant": "warning"},
    "RAPID" : {"msg": "changements prévus rapidement (avant une demi-heure en moyenne)", "variant": "danger"},
    "TEMPO" : {"msg": "fluctuations temporaires dans un bloc de 1 à 4 heures.", "variant": "warning"},
    "INTER" : {"msg": "changements fréquents mais brefs", "variant": "danger"},
    "TEND" : {"msg": "No trend informations.", "variant": "info"}
}

interface WindData {
    orientation:number,
    strength:number,
    variant: {
        min:number,
        max:number
    }
}

interface WeatherData {
    intensity:string,
    data:any
}

interface CloudsData {
    data:any,
    height:number,
}

interface TemperatureData {
    normal:number,
    dew:number
}

interface MetarPanelState {
    icao:string,
    timestamp:any,
    metar:any,
    rawMetar:string,
    wind:WindData
    visibility:number,
    weather:WeatherData,
    clouds:Array<CloudsData>,
    temperature:TemperatureData,
    pressure:number,
    trendData:any
}

interface MetarPanelProps {
    ICAO:string,
    updateScore:any
}

class MetarPanel extends React.Component<MetarPanelProps, MetarPanelState> {

    constructor(props:MetarPanelProps) {
        super(props);
        this.state = {
            icao: "",
            rawMetar: "",
            metar: null,
            timestamp: moment().utcOffset(0),
            wind: {
                orientation: 0,
                strength: 0,
                variant: {
                    min: 0,
                    max: 0
                }
            },
            visibility: 0,
            weather: {
                intensity: "",
                data: null
            },
            clouds: [],
            temperature: {
                normal: 0,
                dew: 0
            },
            pressure: 0,
            trendData: null
        }
    }

    async componentDidMount() {
        let metar:any = await queryMetar(this.props.ICAO);
        
        let weatherData = {
            "msg": "No particular events",
            "variant": "success"
        }
        for (const code in Object.keys(WeatherCodes)) {
            if (metar.weather.includes(code)) weatherData = WeatherCodes[code];
        }
        let trendData = TrendCodes[metar.trend];

        this.setState({
            icao: metar.icao,
            rawMetar: metar.raw,
            metar: metar,
            timestamp: moment(metar.timestamp, "DDhh:mmZ").utcOffset(0),
            wind: {
                orientation: parseInt(metar.wind.substr(0, 3)),
                strength: parseInt(metar.wind.substr(3, 2)),
                variant: { min: 0, max: 0 }
            },
            visibility: parseInt(metar.visibility == "CAVOK" ? "9999" : metar.visibility),
            weather: {
                intensity: (metar.weather[0] == '+' ? "Heavy" : (metar.weather[0] == '-' ? "Light" : "Moderate") ),
                data: weatherData
            },
            temperature: {
                normal: parseInt(metar.temperature.substr(0, 3)),
                dew: parseInt(metar.temperature.substr(3, 3))
            },
            pressure: parseInt(metar.pressure.substr(1, metar.pressure.length)),
            trendData: trendData
        });
        let clouds = [];
        for (const cloud of metar.clouds) {
            if (cloud == '') continue; //Skip no data
            clouds.push({
                data: CloudCodes[cloud.substr(0, 3)],
                height: parseInt(cloud.substr(3, 6)) * 100
            });
        }
        this.setState({ clouds: clouds });
        if (metar.windVariant) {
            this.setState({
                wind: {
                    orientation: parseInt(metar.wind.substr(0, 3)),
                    strength: parseInt(metar.wind.substr(3, 2)),
                    variant: {
                        min: parseInt(metar.windVariant.substr(0, 3)),
                        max: parseInt(metar.windVariant.substr(4, 3))
                    }
                }
            });
        }
        this.props.updateScore();

        this.render();
    }

    getGlobalScore() {
        let score = 0;
        score += checkRule("Visibility", this.state.visibility);
        score += checkRule("Wind", this.state.wind);
        score += checkRule("Clouds", this.state.clouds);
        return (score);
    }

    render() {
        if (this.state.rawMetar == "") return (<React.Fragment></React.Fragment>);
        let timestamp = moment(this.state.timestamp, "DDhh:mmZ").utcOffset(0);
        return (
            <Card>
                <Card.Title>{this.state.icao}</Card.Title>
                <Card.Subtitle>{timestamp.format('MMMM Do YYYY, h:mm:ss a')} ({timestamp.fromNow()})</Card.Subtitle>
                <Card.Body>
                    <InputGroup.Text id="rawMetar">{this.state.rawMetar}</InputGroup.Text>
                    <h3>Forecast:</h3>
                    <Alert variant={scoreToVariant(checkRule("Visibility", this.state.visibility))}>
                        Visibility {this.state.visibility == 9999 ? ">= 10" : this.state.visibility} Km
                    </Alert>
                    <Alert variant={scoreToVariant(checkRule("Wind", this.state.wind))}>
                        {this.state.wind.strength} Kt at {this.state.wind.orientation}° ({windDirection(this.state.wind.orientation)})<br />
                        Variant from {this.state.wind.variant.min}° ({windDirection(this.state.wind.variant.min)}) to {this.state.wind.variant.max}° ({windDirection(this.state.wind.variant.max)})
                    </Alert>
                    <Alert variant={this.state.weather.data.variant}>
                        Weather events: {this.state.weather.data.msg === "N/A" ? "" : this.state.weather.intensity} {this.state.weather.data.msg}
                    </Alert>
                    {(this.state.clouds.length > 0) &&
                    <Alert variant={scoreToVariant(checkRule("Clouds", this.state.clouds))}>
                        {this.state.clouds.map((cloud) => {
                            return (<React.Fragment>{cloud.data.msg} at {cloud.height} feets<br /></React.Fragment>);
                        })}
                    </Alert>
                    }
                    <Alert variant={this.state.trendData.variant}>
                        Temperature is <b>{this.state.temperature.normal}°C</b> / Dew point: <b>{this.state.temperature.dew}°C</b><br />
                        <b>{this.state.pressure} Hpa</b><br />
                        Trend: <b>{this.state.trendData.msg}</b>
                    </Alert>
                </Card.Body>
            </Card>
        );
    }

}

export default MetarPanel;