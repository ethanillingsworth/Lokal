
const select = document.getElementById("sel-cate")

function addOption(name) {
    const opt = document.createElement("option")
    opt.innerText = name
    select.append(opt)
}

addOption("Party")
addOption("Sports")
addOption("Concert")
addOption("Conference")
addOption("Festival")
addOption("Workshop")
addOption("Seminar")
addOption("Exhibition")
addOption("Theater/Performance")
addOption("Networking Event")
addOption("Fundraiser")
addOption("Ceremony")
addOption("Charity Event")
addOption("Competition")
addOption("Wedding")
addOption("Reunion")
addOption("Tour")
addOption("Show")
addOption("Other")

const date = document.getElementById("date")
const today = new Date()
date.value = today.toLocaleDateString('en-US')

date.onblur = (e) => {
    const newDate = new Date(date.value)

    if (newDate >= today) {
        date.value = newDate.toLocaleDateString('en-US')
    }
    else {
        date.value = today.toLocaleDateString('en-US')
    }
}


