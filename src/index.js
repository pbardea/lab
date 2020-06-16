import React from 'react';
import ReactDOM from 'react-dom';
import Lab from './components/lab';

class App extends React.Component {

  render() {
    return <Lab />
  }
}

ReactDOM.render(<App />, document.getElementById('root'));
