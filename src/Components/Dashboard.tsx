import React from 'react';
import { checkRule, scoreToVariant } from '../Helpers/Query';
import Alert from 'react-bootstrap/Alert';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

import Config from '../config.json';
import MetarPanel from './MetarPanel';

interface DashboardState {
    metarsRef:Array<React.RefObject<MetarPanel>>
    score:number,
    arrivals:string
}

interface DashboardProps {
}

class Dashboard extends React.Component<DashboardProps, DashboardState> {

    constructor(props:DashboardProps)
    {
      super(props);
      
      let refs = [];
      for (const ICAO of Config.metar.ICAO) {
        refs.push(React.createRef<MetarPanel>());
      }

      this.state = {
        metarsRef: refs,
        score: 0,
        arrivals: ""
      }
    }

    updateScore(): void {
        let score = 0;
        for (const ref of this.state.metarsRef) {
            console.log("cer moi")
            score += ref!.current!.getGlobalScore();
        }
        this.setState({ score: score });
        this.render();
    }

    render() {

        return (
            <Container>
                <Row>
                    <Alert variant={scoreToVariant(this.state.score)}>
                        {this.state.score == 0 ? "The planes are NOT landing above Antibes!" : "The planes are landing above Antibes... Sorry!"}
                    </Alert>
                </Row>
                <h2>Nearby Airport Meteorologic reports</h2>
                <Row>
                    {Config.metar.ICAO.map((ICAO:string, idx:number) => <Col key={idx}><MetarPanel ICAO={ICAO} ref={this.state.metarsRef[idx]} updateScore={this.updateScore} /></Col> )}
                </Row>
            </Container>
        );
    }
}

export default Dashboard;
