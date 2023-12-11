import EventEmitter from 'events';

// Create a class that extends EventEmitter
class MyEmitter extends EventEmitter {}

// Create an instance of the class
const myEmitter = new MyEmitter();

// Export the instance
export default myEmitter;