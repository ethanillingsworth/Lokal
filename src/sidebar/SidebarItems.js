export function SidebarItem({ text = "None", img = "/img/icons/x.png" }) {
    return (
        <div className="item" tabIndex="0">
            <img src={img} alt={text} className="icon" />
            <h4>{text}</h4>
        </div >
    );
}


export function SidebarLink({ text, img, link }) {
    return (
        <a href={link} tabIndex="-1000">
            <SidebarItem text={text} img={img} />
        </a>
    );
}
