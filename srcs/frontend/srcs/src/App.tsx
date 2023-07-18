import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LoginScreen from './pages/LoginScreen'
import HomeScreen from './pages/HomeScreen'
import EditProfileScreen from './pages/EditProfileScreen'
import GameScreen from './pages/GameScreen'
import GameHistoryCmp from './pages/GameHistoryScreen'
import axios from 'axios'
import TwoFactorAuthScreen from './pages/TwoFactorAuthScreen'
import PageNotFoundCmp from './componets/PageNotFoundCmp'
import ChatScreen from './pages/ChatScreen'
import DirectMessageScreen from './pages/DirectMessageScreen'
import LookProfileScreen from './pages/LookProfileScreen'
import GlobalRankScreen from './pages/GlobalRankScreen'
import AchievementsScreen from './pages/AchievementsScreen'

const axiosSetup = () => {

  axios.defaults.baseURL = `${process.env.REACT_APP_BACKEND_URI}`

  axios.interceptors.request.use(config => {
    config.withCredentials = true
    return (config)
  })
}

function App() {

  axiosSetup()
  
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<LoginScreen/>}/>
          <Route path='/validate' element={<TwoFactorAuthScreen/>}/>
          <Route path='/home' element={<HomeScreen/>}/>
          <Route path='/editprofile' element={<EditProfileScreen/>}/>
          <Route path='/game/:gameId' element={<GameScreen/>}/>
          <Route path='/history' element={<GameHistoryCmp/>}/> 
          <Route path='/chat/:roomId' element={<ChatScreen/>}/>
          <Route path='/directmessage/:userId' element={<DirectMessageScreen/>}/>
          <Route path='/profile/:userId' element={<LookProfileScreen/>}/>
          <Route path='/profile/:userId/:backPage' element={<LookProfileScreen/>}/>
          <Route path='/profile/:userId/:backPage/:backPageArg' element={<LookProfileScreen/>}/>
          <Route path='/rank' element={<GlobalRankScreen/>}/>
          <Route path='/achievements' element={<AchievementsScreen/>}/>
          <Route path='*'element={<PageNotFoundCmp/>}/>
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App