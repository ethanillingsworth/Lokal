// App.js
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import EventsPage from './pages/EventsPage';
import './css/global.css';
import Sidebar from './sidebar/Sidebar';
import { SidebarLink, SidebarItem } from './sidebar/SidebarItems';

function App() {
    return (
        <BrowserRouter>
            <Sidebar>
                <h1 id='heading'>Lokal</h1>
                <hr style={{ margin: 20, marginTop: 0, width: "calc(100% - 40px)" }}></hr>
                <div className='menu col'>
                    <SidebarLink text="Events Feed" img="/img/icons/party.png" link="/" />
                    <SidebarLink text="Group Finder" img="/img/icons/groupfind.png" link="/groupfinder" />
                    <SidebarItem text="Notifications" img="/img/icons/notif.png" />
                </div>

                <div id='bottom'>
                    <SidebarItem text="Your Groups" img="/img/icons/groups.png" />

                    <SidebarLink text="Username" img="/img/icons/x.png" link={`/user`} />
                    <SidebarItem text="More" img="/img/icons/more.png" />



                </div>


            </Sidebar>
            <div id='content'>
                <Routes>

                    <Route path="/" element={<EventsPage />} />
                    <Route path="/user" element={<EventsPage />} />



                </Routes>
            </div>

        </BrowserRouter>
    );
}

export default App;