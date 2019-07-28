import React from 'react';
import './TaskForm.css';

class TaskFrom extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      content: ''
    };
  }
  
  handleChange = (event) => {
    this.setState({content: event.target.value});
  }

  handleSubmit = (event) => {
    event.preventDefault();
    this.props.addTask(this.state.content);
    this.setState({content: ''});
  }

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <input className="TaskFormInput"
          value={this.state.content} 
          onChange={this.handleChange} 
          placeholder="new task" 
          autoComplete="on" 
          autoFocus
        />
      </form>
    );
  }
}

export default TaskFrom;