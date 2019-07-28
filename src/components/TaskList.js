import React from 'react';
import './TaskList.css'

class TaskList extends React.Component {

  render() {
    return (
      <div className="TaskList">
        <ul className="TaskItems">
          { this.props.tasks.map(task => 
            <li className="TaskItem" key={task.id}>
              <input className="TaskCheckbox" 
                type="checkbox"
                checked={task.completedTime !== 0}
                onChange={(e) => this.props.updateTask(task.id, "complete")}
              />
              <label className="TaskLabel"
                onClick={() => this.props.updateTask(task.id, "priority")}
                style={{color: task.priority ==='H' ?"red" : task.priority === 'M' ? "orange" : "black"}}
              >
                {task.content}
              </label>
              <span className="TaskDeleteBtn"
                onClick={() => this.props.removeTask(task.id)}
              >
                X
              </span>
            </li>
          )}
        </ul>
      </div>
    );
  }
}

export default TaskList;
