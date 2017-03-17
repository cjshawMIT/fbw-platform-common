import React, {Component} from 'react'
import { browserHistory } from 'react-router'

import './Login.scss'

class Login extends Component {
  constructor() {
    super();
    this.state = {
      isVisitorLoginVisible: false
    }
  }

  componentDidMount () {
    if (this.props.username) {
      this.props.logout()
    }
  }

  componentDidUpdate () {
    if (this.props.isVisitor && this.textInput) {
      this.textInput.focus()
    }
  }

  render() {
    const props = this.props;

    let loginButtonText
    if (props.isLoginInProgress) {
      loginButtonText = (<div className="">Logging you in...</div>)
    } else {
      loginButtonText = (<div className="">
        Login
      </div>)
    }

    let visitorLogin,
      visitorButtonText = 'Visiting?';
    if (this.state.isVisitorLoginVisible) {
      visitorButtonText = 'Cancel';

      let loginButton = (
        <button type="submit" disabled={this.props.username ? false : true} className="login-form-button login-form-button--submit">
          {loginButtonText}
        </button>
      )

      visitorLogin = (
        <div className="medium-5 medium-centered columns">
          <form onSubmit={(e) => this._loginUserSimple(e)}>
            <input type="text"
              ref={(input) => {this.textInput = input;}}
              onChange={(e) => props.updateUsername(e.target.value.toUpperCase())}
              placeholder='Username'
              className="login-form__input"
              value={props.username} />

            {loginButton}
          </form>
        </div>
      )
    }

    return (
      <div className="login">
        <h1 className="app-name text-center">Fly-by-Wire</h1>

        <div className="school-buttons flex-container space-between medium-8 medium-centered columns">
          <button disabled
            className="login-form-button login-form-button--d2l is-disabled">
            Arapahoe <img className="d2l-login-button__image" src={require('../../../assets/myACC.png')} />
          </button>
          <button disabled
            className="login-form-button login-form-button--d2l is-disabled">
            Quinsigamond
          </button>
        </div>

        <button className="visiting-prompt-button" onClick={() => this.setState({isVisitorLoginVisible: !this.state.isVisitorLoginVisible})} >
          {visitorButtonText}
        </button>

        {visitorLogin}

      </div>
    )
  }

  _handleACCLogin = () => {
    window.open(this.props.authenticationUrl, '_self')
  }

  _loginUserSimple = (e) => {
    console.log('logging in with visitor username:', this.props.username)

    e.preventDefault();
    if (this.props.username !== '') {
      this.props.login('fbw-visitor', this.props.username)
      // this.props.onSetEnrolledSubjects(bankIds)
      browserHistory.push('/')
    }
  }

}

export default Login
