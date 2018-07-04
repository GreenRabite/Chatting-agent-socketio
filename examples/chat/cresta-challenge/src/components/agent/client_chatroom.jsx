import React from 'react';
import './client-chatroom.css';

class ClientChatroom extends React.Component{
  constructor(props){
    super(props);
    this.socket = this.props.socket;
    this.handleUpdate = this.handleUpdate.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.addMessage = this.addMessage.bind(this);
    this.handleKeyPress = this.handleKeyPress.bind(this);
    this.grabSuggestions = this.grabSuggestions.bind(this);
    this.handleSuggestion = this.handleSuggestion.bind(this);
    this.handleFocus = this.handleFocus.bind(this);
    this.handleBlur = this.handleBlur.bind(this);
    this.setTimer = this.setTimer.bind(this);
    this.getTimer = this.getTimer.bind(this);
    this.timeSince = this.timeSince.bind(this);
    this.timer = 0;
    this.borderCheck = this.borderCheck.bind(this);
    this.state = {
           username: this.props.username,
           suggestion: true,
           suggestions: [],
           message: '',
           messages: [],
           chatBorders: [],
           lastMsgTime: 'N/A',
           seconds: 0
         };
  }

  componentDidMount(){
    this.socket.on('RECEIVE_MESSAGE', (data)=>{
           this.addMessage(data);
           if (data.sender === 'client' && data.room === this.props.roomId) {
             if (this.timer !== 0) {
               clearInterval(this.timer);
               this.timer = 0;
               this.setState({
                 lastMsgTime: `0s`,
                 seconds: 0
               });
             }else {
               this.setState({
                 lastMsgTime: `0s`
               });
             }
             this.getTimer(data);
           }
       });
  }

  addMessage(data){
    console.log(data);
    if (data.room === this.props.roomId) {
      this.setState({
        messages: this.state.messages.concat([[data.message,
                                               data.sender,
                                               data.time ]])
      });
    }
  }

  getTimer(data){
    console.log(data);
    console.log(this.timeSince(data.time));
    if (this.timer === 0){
      this.timer = setInterval(()=>{
        let seconds = this.state.seconds + 1;
        if (seconds < 60) {
          this.setState({
            lastMsgTime: `${seconds}s`,
            seconds
          });
        }else if (seconds >= 60 && seconds < 3600) {
          this.setState({
            lastMsgTime: `${Math.floor(seconds / 60)}m`,
            seconds
          });
        }else {
          this.setState({
            lastMsgTime: `${Math.floor(seconds / 3600)}h`,
            seconds
          });
        }
      },1000);
    }
  }

  timeSince(date) {
    let seconds = Math.floor((new Date() - date) / 1000);
    let interval = Math.floor(seconds / 31536000);
    interval = Math.floor(seconds / 3600);
    if (interval > 1) {
      return interval + " hours ago";
    }
    interval = Math.floor(seconds / 60);
    if (interval > 1) {
      return interval + " minutes ago";
    }
    return 'just now';
  }

  handleUpdate(field){
    return (e) => {
      this.setState({
        [field] : e.target.value
      });
    };
  }

  handleSubmit(e){
    e.preventDefault();
    this.socket.emit('SEND_MESSAGE', {
                message: this.state.message,
                room: this.props.roomId,
                sender: 'agent',
                time: Date.now()
            });
    this.setState({message: ''});
    const suggestCon = document.querySelector(`#suggestion-${this.props.roomId}`);
    if (suggestCon !== null) {
      suggestCon.classList.add('hidden');
    }
  }

  handleKeyPress(e){
    if (e.keyCode === 13 || e.charCode === 13) {
      this.handleSubmit(e);
    }else if (this.state.suggestion) {
      this.grabSuggestions();
    }
  }

  setTimer(){
    let min = 3;
    let max = 5;
    const rand = Math.floor(Math.random() * (max - min + 1) + min);
    setTimeout(()=>{
      this.setState({
        suggestion: true
      });
    }, rand * 1000);
  }

  grabSuggestions(){
    if (this.state.suggestion) {
      this.setState({suggestion: false});
      this.setTimer();
      fetch('https://dev.cresta.ai/api/front_end_challenge')
        .then(function(res){
          return res.json();
        })
        .then(json => {
          if (json.error) {
            console.log('Error occurred');
          }else {
            let suggestions = [];
            let index = 0;
            json.forEach(suggestion => {
              suggestions.push(suggestion[`suggestion ${index}`]);
              index++;
            });
            const suggestCon = document.querySelector(`#suggestion-${this.props.roomId}`);
            if (suggestCon !== null) {
              suggestCon.classList.remove('hidden');
            }
            return this.setState({
              suggestions
            });
          }
        });
    }
  }

  handleSuggestion(e){
    e.preventDefault();
    const suggestCon = document.querySelector(`#suggestion-${this.props.roomId}`);
    suggestCon.classList.add('hidden');
    this.setState({
      message: e.target.innerText
    });
      const input = document.querySelector(`#agent-chat-container-${this.props.roomId} .agent-input textarea`);
      input.focus();
  }

  handleFocus(e){
    const container = document.querySelector(`#agent-chat-container-${this.props.roomId}`);
    const input = container.querySelector(`.agent-input`);
    const name = container.querySelector(`#agent-${this.props.roomId}`);
    container.classList.add('focus');
    input.classList.add('text-focus');
    name.classList.add('name-focus');
  }

  handleBlur(){
    const container = document.querySelector(`#agent-chat-container-${this.props.roomId}`);
    const input = container.querySelector(`.agent-input`);
    const name = container.querySelector(`#agent-${this.props.roomId}`);
    container.classList.remove('focus');
    input.classList.remove('text-focus');
    name.classList.remove('name-focus');
  }

  borderCheck(){
    const chatBorders = [];
    const msgs = this.state.messages;
    for (let i = 0; i < msgs.length; i++) {
      if (i === 0) {
        if (msgs[i][1] === 'agent' && msgs[i+1][1] === 'agent'){
          chatBorders.push('RD');
        }else if (msgs[i][1] === 'client' && msgs[i+1][1] === 'client') {
          chatBorders.push('LD');
        }else {
          chatBorders.push('NADA');
        }
      }else if (i > 0 && i < msgs.length - 1) {
        if (msgs[i][1] === 'agent' && msgs[i + 1][1] === 'agent' && msgs[i -1][1] === 'agent') {
          chatBorders.push('RUD');
        }else if (msgs[i][1] === 'agent' && msgs[i + 1][1] === 'agent') {
          chatBorders.push('RD');
        }else if (msgs[i][1] === 'agent' && msgs[i - 1][1] === 'agent') {
          chatBorders.push('RU');
        }else if (msgs[i][1] === 'client' && msgs[i + 1][1] === 'client' && msgs[i - 1][1] === 'client') {
          chatBorders.push('LUD');
        }else if (msgs[i][1] === 'client' && msgs[i + 1][1] === 'client') {
          chatBorders.push('LD');
        }else if (msgs[i][1] === 'client' && msgs[i - 1][1] === 'client') {
          chatBorders.push('LU');
        }else {
          chatBorders.push('NADA');
        }
      }else if (i === msgs.length - 1) {
        if (msgs[i][1] === 'agent' && msgs[i - 1][1] === 'agent'){
          chatBorders.push('RU');
        }else if (msgs[i][1] === 'client' && msgs[i - 1][1] === 'client') {
          chatBorders.push('LU');
        }else {
          chatBorders.push('NADA');
        }
      }
    }
    console.log(chatBorders);
    this.setState({chatBorders: chatBorders});
  }

  render(){
    const divStyle = {
      background: this.props.color
    };
    const lastMsgStyleSender ={
      textAlign: 'right',
      marginRight: '25px'
    };
    const lastMsgStyleReceiver ={
      textAlign: 'left',
      marginLeft: '34px'
    };
    let messages = this.state.messages.map(message=>{
      if (message[1] === 'client') {
        return <div className='ag-client-msg-container'><div className="messages-agent ag-client-msg" style={{backgound:"white"}}>{`${message[0]}\n`} </div></div>;
      }else {
        return <div className="ag-agent-msg-container"><div className="messages-agent ag-agent-msg" style={divStyle}>{`${message[0]}\n`}</div></div>;
      }
    });
    let sinceLastMsg;
    if (this.state.messages.length > 0) {
      const msgs = this.state.messages;
      if (msgs[msgs.length - 1][1] === 'agent') {
        sinceLastMsg = <div className='a-last-msg-agent' style={lastMsgStyleSender}>
                        {this.timeSince(msgs[msgs.length - 1][2])}
                      </div>;
      }else {
        sinceLastMsg = <div className='a-last-msg-agent' style={lastMsgStyleReceiver}>
                        {this.timeSince(msgs[msgs.length - 1][2])}
                      </div>;
      }
    }
    let speechbubbles = this.state.suggestions.map(suggestion =>{
      return <div className='suggestion-item'
                  onClick={this.handleSuggestion}><span>{suggestion}</span></div>;
    });
    if (this.state.messages.length > 1 && this.state.messages.length !== this.state.chatBorders.length) {
      this.borderCheck();
    }
    if (this.state.messages.length > 1 && this.state.messages.length === this.state.chatBorders.length) {
      const container = document.querySelector(`#agent-chat-container-${this.props.roomId}`);
      const chatBubbles = [...container.querySelectorAll('.messages-agent')];
      for (let i = 0; i < this.state.chatBorders.length; i++) {
        let shape;
        let margin;
        if (this.state.chatBorders[i] === 'RU') {
          shape = 'bubble-right-up';
          margin = 'margin-bot-diff';
        }else if (this.state.chatBorders[i] === 'RD') {
          shape = 'bubble-right-down';
          margin = 'margin-bot-same';
          if (chatBubbles[i].classList.contains('margin-bot-diff')) chatBubbles[i].classList.remove('margin-bot-diff');
        }else if (this.state.chatBorders[i] === 'RUD') {
          shape = 'bubble-right';
          margin = 'margin-bot-same';
          if (chatBubbles[i].classList.contains('margin-bot-diff')) chatBubbles[i].classList.remove('margin-bot-diff');
        }else if (this.state.chatBorders[i] === 'LU') {
          shape = 'bubble-left-up';
          margin = 'margin-bot-diff';
        }else if (this.state.chatBorders[i] === 'LD') {
          shape = 'bubble-left-down';
          margin = 'margin-bot-same';
          if (chatBubbles[i].classList.contains('margin-bot-diff')) chatBubbles[i].classList.remove('margin-bot-diff');
        }else if (this.state.chatBorders[i] === 'LUD') {
          shape = 'bubble-left';
          margin = 'margin-bot-same';
          if (chatBubbles[i].classList.contains('margin-bot-diff')) chatBubbles[i].classList.remove('margin-bot-diff');
        }else {
          margin = 'nada';
        }
        if (margin !== 'nada') {
          chatBubbles[i].classList.add(margin);
        }
        chatBubbles[i].classList.add(shape);
      }
    }
    return(
      <div onFocus={this.handleFocus}
           onBlur={this.handleBlur}
           className="agent-chat-container"
           id={`agent-chat-container-${this.props.roomId}`}>
        <div className="agent-header">
          <p id={`agent-${this.props.roomId}`}>{this.props.username}</p>
          <div class="dot" style={divStyle}>{this.state.lastMsgTime}</div>
        </div>
        <hr/>
        <div className="agent-chat">
          {messages}
          {sinceLastMsg ? sinceLastMsg : ''}
        </div>
        <div id={`suggestion-${this.props.roomId}`} className='speech-bubble-container hidden'>
          <div className="flex speech-bubble">{speechbubbles}</div>
        </div>
        <div className="agent-input">
          <form onSubmit={this.handleSubmit}>
            <textarea rows="7"
                      onChange={this.handleUpdate("message")}
                      onKeyPress={this.handleKeyPress}
                      value={this.state.message}
                      placeholder="Type a message..."/>
          </form>
        </div>
      </div>
    );
  }
}

export default ClientChatroom;
