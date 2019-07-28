import React from 'react';
import Axios from 'axios';
import './App.css';
import TaskList from './components/TaskList';
import TaskForm from './components/TaskForm';

const URL = process.env.REACT_APP_URL;

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tasks: [],
      taskIdx: 1,
      connection: '',
      errcode: null
    }
  }

  localStorageEnabled = () => {
    try {
      const key = 'test';
      localStorage.setItem(key, key);
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      return false;
    }
  }

  internetConnected = () => {
    return navigator.onLine;
  }

  componentDidMount() {
    // use localStorage first 
    // how about multiple devices?
    // and how about user accidentally cleared the local storage?
    if (this.localStorageEnabled()) {
      this.fetchLocalStorageData()
    } else {
      alert("Local storage needs to be enabled to sync tasks!");
      if (this.internetConnected()) {
        this.fetchCloudData();
      }
    }
    window.addEventListener("online", this.syncData);
    window.addEventListener("offline", this.updateConnection);
    
  }

  componentWillUnmount() {
    if (this.internetConnected()) {
      this.syncData();
    }
    window.removeEventListener("online", this.syncData);
    window.removeEventListener("offline", this.updateConnection);
  }

  updateConnection = () => {
    this.setState({connection: this.internetConnected() ? '' : " (offline)"});
  }

  syncData = () => {
    this.updateConnection();
    if (this.internetConnected()) {
      // use post instead of put
      Axios.post(`${URL}/api/tasks`, this.state.tasks)
        .then(res => {
          this.fetchCloudData();
        })
        .catch(error => this.handleError(error));
    }
    if (this.localStorageEnabled() && localStorage.deletedTasks) {
      const deletedTasks = JSON.parse(localStorage.deletedTasks);
      Axios.post(`${URL}/api/tasks`, deletedTasks)
        .then(res => {
          localStorage.removeItem('deletedTasks');
        });
    }
  }

  fetchCloudData = () => {
    Axios.get(`${URL}/api/tasks/undeleted`)
      .then(res => {
        this.setState({tasks: res.data});
      })
      .catch(error => this.handleError(error));
    Axios.get(`${URL}/api/tasks/count`)
      .then(res => {
        this.setState({taskIdx: res.data + 1});
      })
      .catch(error => this.handleError(error));
  }

  fetchLocalStorageData = () => {
    if (localStorage.tasks) {
      this.setState({tasks: JSON.parse(localStorage.tasks)});
    }
    if (localStorage.taskIdx) {
      this.setState({taskIdx: JSON.parse(localStorage.taskIdx)});
    }
  }

  updateLocalStorageTasks = () => {
    if (this.localStorageEnabled()) {
      localStorage.tasks = JSON.stringify(this.state.tasks);
    }
  }

  updateLocalStorageTaskIdx = () => {
    if (this.localStorageEnabled()) {
      localStorage.taskIdx = JSON.stringify(this.state.taskIdx);
    }
  }

  handleError = (error) => {
    if (error.response) {
      this.setState({errcode: error.response.status});
      console.log("error response: ", error.response.status);
    } else {
      this.setState({errcode: error.message});
      console.log("error message: ", error.message);
    }
  }

  postCloudTask = (task) => {
    if (this.internetConnected()) {
      Axios.post(`${URL}/api/task`, task)
        .catch(error => this.handleError(error))
    }
  }

  deleteTask = (deletedTask) => {
    const task = {
      ...deletedTask,
      lastModifiedTime: Date.now(),
      deleted: true
    };
    if (this.internetConnected()) {
      // use post for sync cloud with localStorage
      this.postCloudTask(task);
    } else if (this.localStorageEnabled()) {
      // if offline, update localStorage for later sync
      let deletedTasks = [];
      if (localStorage.deletedTasks) {
        deletedTasks = JSON.parse(localStorage.deletedTasks);
      }
      localStorage.deletedTasks = JSON.stringify([...deletedTasks, task]);
    }
  }

  handleTaskCreation = (content) => {
    const task = { 
      id: this.state.taskIdx, 
      content,  
      createdTime: Date.now(),
      completedTime: 0,
      priority: 'L',
      lastModifiedTime: 0,
      deleted: false
    };
    this.setState(
      {
        taskIdx: this.state.taskIdx + 1,
        tasks: [...this.state.tasks, task]
      }, () => {
        // in case
        this.postCloudTask(task);
        this.updateLocalStorageTasks();
        this.updateLocalStorageTaskIdx();
      }
    );
  }

  handleTaskUpdate = (id, update) => {
    let updatedTask;
    let time = Date.now();
    const tasks = this.state.tasks.map(task => {
      if (task.id !== id) {
        return task;
      }
      if (update === 'complete') {
        updatedTask = {
          ...task,
          completedTime: task.completedTime !== 0 ? 0 : time,
          lastModifiedTime: time
        };
      } else if (update === 'priority') {
        updatedTask = {
          ...task,
          priority: task.priority === 'L' ? 'M' : task.priority === 'M'? 'H' : 'L',
          lastModifiedTime: time
        };
      }
      return updatedTask;
    })
    this.setState({tasks}, () => {
      // use post for sync cloud with localStorage
      this.postCloudTask(updatedTask)
      this.updateLocalStorageTasks();
    });
  }

  handleTaskDeletion = (id) => {
    const { tasks } = this.state;
    let deletedTask;
    for (let i = 0; i < tasks.length; i++) {
      if (tasks[i].id === id) {
        deletedTask = tasks[i];
        break;
      }
    }
    this.setState({
      tasks: tasks.filter(task => task.id !== id)
    }, () => {
      // in case
      this.updateLocalStorageTasks();
      this.deleteTask(deletedTask);
    });
  }

  render() {
    return (
      <div className="App">
        <div className="Title">
          <p>Planner{this.state.connection}</p>
        </div>
        <TaskForm
          addTask={this.handleTaskCreation} 
        />
        <br />
        <TaskList
          tasks={this.state.tasks} 
          updateTask={this.handleTaskUpdate} 
          removeTask={this.handleTaskDeletion}
        />
      </div>
    );
  }
}

export default App;
