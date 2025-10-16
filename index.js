import { menuArray } from './data'

const menuCardsSection = document.getElementById('menu-cards')
const preCheckoutSection= document.getElementById('pre-checkout-section')

class OrderLine {
    constructor(itemName, itemPrice, itemTotal=1) {
        this.itemName = itemName
        this.itemPrice = Number.parseInt(itemPrice)
        this.itemTotal = Number.parseInt(itemTotal)
    }

    addOneItem() {
        this.itemTotal++
    }

    subtractOneItem() {
        this.itemTotal--
    }

    getItemPrice() {
        return this.itemPrice
    }

    getItemTotal() {
        return this.itemTotal
    }

    setItemTotal(setter) {
        this.itemTotal = setter
    }

    calculateTotalPrice() {
        return this.itemPrice * this.itemTotal
    }
}

class UserOrder {
    constructor() {
        this.name = "default name"
        this.allOrderLine = []
        this.cardNumber = 1234123412341234
        this.cardCVV = 123
        this.totalPrice = 0
        this.saveToLocalStorage = false
    }

    updateOrderBucket(menuName, actionType, menuPrice=1) {
        let isItemInBucketAlready = false

        this.allOrderLine.forEach(userOrder => {
            if (userOrder.itemName === menuName) {
                const prevItemTotal = userOrder.getItemTotal()

                if (actionType.includes('add')) {
                    userOrder.addOneItem()
                }
                else if (actionType.includes('subtract')) {
                    userOrder.subtractOneItem()
                }
                else if (actionType.includes('remove')) {
                    userOrder.setItemTotal(0)
                }

                this.totalPrice -= userOrder.getItemPrice() * prevItemTotal
                this.totalPrice += userOrder.calculateTotalPrice()
                isItemInBucketAlready = true
            }
        })
        
        if (!isItemInBucketAlready) {
            this.allOrderLine.push(new OrderLine(menuName, menuPrice))

            this.totalPrice += this.allOrderLine.at(this.allOrderLine.length - 1).calculateTotalPrice()
            isItemInBucketAlready = true
        }

        this.allOrderLine = this.allOrderLine.filter(userOrder => userOrder.getItemTotal() > 0)
    }

    getTotalPrice() {
        return this.totalPrice
    }

    setName(newName) {
        this.name = newName
    }

    setCardNumber(newCardNum) {
        this.cardNumber = newCardNum
    }

    setCardCVV(newCVV) {
        this.cardCVV = newCVV
    }

    getOrderData() {
        return this
    }

    getSaveToLocalStorage() {
        return this.saveToLocalStorage
    }

    toggleSaveToLocalStorage() {
        this.saveToLocalStorage = !this.saveToLocalStorage
    }

    clearUpBucket() {
        this.allOrderLine = []
        this.totalPrice = 0
    }
}

const userOrderBucket = configureLocalStorage()

function configureLocalStorage() {
    let userOrderBucketFromLocalStorage

    if (!localStorage.getItem('userOrderBucket')) {
        userOrderBucketFromLocalStorage = new UserOrder()
        localStorage.setItem('userOrderBucket', JSON.stringify(userOrderBucketFromLocalStorage))
    } else {
        const retrievedUserOrderBucket = JSON.parse(localStorage.getItem('userOrderBucket'))
        userOrderBucketFromLocalStorage = Object.assign(new UserOrder(), retrievedUserOrderBucket)
        userOrderBucketFromLocalStorage.allOrderLine = userOrderBucketFromLocalStorage.allOrderLine.map(ob => 
            Object.assign(new OrderLine(ob.itemName, ob.itemPrice, ob.itemTotal), ob)
        )
    }

    return userOrderBucketFromLocalStorage
}

document.addEventListener('click', (e) => {
    const btnType = Object.values(e.target.dataset).join("").split(" ").pop() || ""

    if (btnType) {
        document.getElementById('order-complete').classList.add("hidden")
        document.getElementById('pre-checkout-section').classList.remove('hidden')

        let siblingMenuDetailsEl
        let menuName
        let menuPrice 

        if (btnType.includes("add")) {
            siblingMenuDetailsEl = e.target.previousElementSibling
            menuName = siblingMenuDetailsEl.querySelector('h2.menu-name').textContent
            menuPrice = siblingMenuDetailsEl.querySelector('p.menu-price').textContent
        }
        else if (btnType.includes("subtract")) {
            siblingMenuDetailsEl = e.target.nextElementSibling
            menuName = siblingMenuDetailsEl.textContent.slice(siblingMenuDetailsEl.textContent.match(/\d+ pcs - /)[0].length)
        }
        else if (btnType.includes("remove")) {
            menuName = e.target.previousElementSibling.textContent
                .slice(e.target.previousElementSibling.textContent
                .match(/\d+ pcs - /)[0].length)        
        }
        else if (btnType.includes("close-modal")) {
            console.log("close modal")
            document.getElementById('checkout-modal-payment').classList.add("hidden")
        }
            
        if (!btnType.includes("close-modal")) userOrderBucket.updateOrderBucket(menuName, btnType, menuPrice)
    }
    else if (e.target.id === "complete-order-btn") {
        renderCheckoutPaySection()
    }
    // else if (e.target.id === "saveToLocalStorage") {
    //     userOrderBucket.toggleSaveToLocalStorage()
    // }
    // else if (e.target.id === "removeLocalStorage") {
    //     localStorage.removeItem("newOrderQueue")
    // }

    localStorage.setItem('userOrderBucket', JSON.stringify(userOrderBucket))
    
    render()
}) 

document.getElementById('payment-form').addEventListener('submit', (e) => {
    
    e.preventDefault()
    const formData = new FormData(e.target)
    e.currentTarget.requestSubmit()

    renderOrderComplete(formData)

    localStorage.setItem('userOrderBucket', JSON.stringify(userOrderBucket))

    render()
})

function renderCard(menuObj) {
    return (
        `
        <div id="menu-id-${menuObj.id}">
            <div class="emoji-container">
                <span class="menu-icon-img">${menuObj.emoji}</span>
            </div>
            <div class="menu-details">
                <h2 class="menu-name">${menuObj.name}</h2>
                <p class="sm menu-ingredients">
                    ${menuObj.ingredients.join(", ")}
                </p>
                <p class="menu-price">${menuObj.price}</p>
            </div>
            <button type="button" 
                class="add-menu-qty-btn" 
                data-order-line="menu-line-${menuObj.id} add"
            >+
            </button>
        </div>
        `
    )
}

function fillOutYourOrderContainer() {
    // load data dari localStorage
    let preCheckoutHTML = `
    <div class="menu-order-container">
        <h2>Your Order</h2>
        <div class="menu-line-order">
        ${userOrderBucket.allOrderLine.map(orderLine => {
            return (
                `<div class="menu-line-order-row">
                    <button type="button" 
                        class="subtract-menu-qty-btn" 
                        data-order-line="menu-line subtract"
                    >
                        <div></div>
                    </button>
                    <p class="menu-line-order-menu-name">${orderLine.itemTotal} pcs - ${orderLine.itemName}</p>
                    <div class="remove-line-order-action" data-remove-order-line="remove" tabindex="0">remove</div>
                    <p class="menu-line-order-menu-price">${orderLine.calculateTotalPrice()}</p>
                </div>`
            )
        }).join(' ')}
        </div>
        <div class="menu-order-row">
            <p class="menu-order-total-price-tag">Total price:</p>
            <span class="dots"></span>
            <p class="menu-order-total-price">${userOrderBucket.getTotalPrice()}</p>
        </div>
        <button class="complete-order-btn" id="complete-order-btn">Order now!</button>
    </div>
    `

    return preCheckoutHTML
}

function renderCheckoutPaySection() {
    document.getElementById('checkout-modal-payment').classList.remove("hidden")

    document.getElementById('payment-form').querySelectorAll('input').forEach(input => {
        if (userOrderBucket.name === "default name") {
            input.value = ''
        } else {
            input.value = userOrderBucket[input.name]
        }
    })
}

function renderOrderComplete(formData) {
    document.getElementById('checkout-modal-payment').classList.add("hidden")
    document.getElementById('pre-checkout-section').classList.add('hidden')
    document.getElementById('order-complete').classList.remove("hidden")

    // send data order in userOrderBucket to server
    // if (userOrderBucket.getSaveToLocalStorage()) {
        userOrderBucket.setCardNumber(formData.get("cardNumber"))
        userOrderBucket.setCardCVV(formData.get('cardCVV'))
        userOrderBucket.setName(formData.get("name"))

        let orderQueueLocalStorage = JSON.parse(localStorage.getItem("newOrderQueue"))
        if (orderQueueLocalStorage) {
            orderQueueLocalStorage.push(Object.assign({}, userOrderBucket))
            localStorage.setItem("newOrderQueue", JSON.stringify(Array.from(orderQueueLocalStorage)))
        }
        else {
            localStorage.setItem("newOrderQueue", JSON.stringify(Array.from([userOrderBucket])))
        }
    // } else {
        // localStorage.removeItem("newOrderQueue")
    // }

    // then remove bucket
    userOrderBucket.clearUpBucket()
}

function fillOutMenuCardsContainer() {
    let menuCardsHTML = ``

    menuArray.forEach(menu => {
        menuCardsHTML += renderCard(menu)
    })

    return menuCardsHTML
}

function render() {
    menuCardsSection.innerHTML = fillOutMenuCardsContainer()

    if (userOrderBucket.allOrderLine.length > 0) {
        preCheckoutSection.innerHTML = fillOutYourOrderContainer()
    } else {
        preCheckoutSection.innerHTML = ``
    }
}

render()