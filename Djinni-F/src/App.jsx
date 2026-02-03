import {useState} from 'react'
import './App.css'
import VttBoard from './VttBoard';
function App() {
    const [count, setCount] = useState(0)
    return (
        <div style={{margin: 0, padding: 0, overflow: 'hidden'}}>
            <VttBoard/>
        </div>
    );
}

export default App
