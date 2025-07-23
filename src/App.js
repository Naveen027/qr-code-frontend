import './App.css';
import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';

const menu = [
  {
    category: "Cakes",
    items: [
      { id: 1, name: "Lounge Elegance Espresso", price: 35 },
      { id: 2, name: "Velvet Mocha Delight", price: 45 },
      { id: 3, name: "Caramel Macchiato Symphony", price: 40 }
    ]
  },
  {
    category: "Pastries",
    items: [
      { id: 4, name: "Butter Croissant", price: 20 },
      { id: 5, name: "Chocolate Danish", price: 300 }
    ]
  },
  {
    category: "Mojitos",
    items: [
      { id: 6, name: "Classic Mint Mojito", price: 120 },
      { id: 7, name: "Strawberry Mojito", price: 150 },
      { id: 8, name: "Lemon Mojito", price: 130 },
      { id: 9, name: "Blue Curacao Mojito", price: 160 },
      { id: 10, name: "Watermelon Mojito", price: 140 }
    ]
  }
];

function App() {
  const [cart, setCart] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", number: "" });
  const [tableId, setTableId] = useState(null);
  const [orderSummary, setOrderSummary] = useState(null);
  const summaryRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = "1"; // static for now
    setTableId(id);
  }, []);

  const addToCart = (item) => {
    const exists = cart.find(i => i.id === item.id);
    if (exists) {
      setCart(cart.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i));
    } else {
      setCart([...cart, { ...item, qty: 1 }]);
    }
  };

  const removeItem = (id) => {
    setCart(cart.filter(i => i.id !== id));
  };

  const changeQty = (id, delta) => {
    setCart(cart.map(i =>
      i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i
    ));
  };

  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0).toFixed(2);

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.id]: e.target.value });
  };

  const downloadImage = () => {
    if (summaryRef.current) {
      html2canvas(summaryRef.current).then(canvas => {
        const link = document.createElement('a');
        link.download = `Order_${orderSummary.order_id}.png`;
        link.href = canvas.toDataURL();
        link.click();
      });
    }
  };

  useEffect(() => {
    if (orderSummary) {
      setTimeout(downloadImage, 300);
    }
  }, [orderSummary]);

  const handleSubmit = async () => {
    const { name, number } = form;
    if (!name || !number) {
      alert("Please fill all fields");
      return;
    }
    if (!tableId) {
      alert("Table number missing. Please scan a valid QR code.");
      return;
    }

    const payload = {
      name,
      number,
      table_id: tableId,
      items: cart.map(i => ({ item: i.name, qty: i.qty, price: i.price })) // ✅ fixed here
    };

    try {
      const res = await fetch("https://qr-code-backend-final.onrender.com/submit-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      if (res.ok && result.order_id) {
        const itemLines = cart.map(i => `• ${i.name} × ${i.qty}`).join('\n');
        const staffPhone = "919019040426";
        const message = `🧾 New Order Received\n\nOrder ID: ${result.order_id}\nTable: ${tableId}\nName: ${name}\nPhone: ${number}\n\nItems:\n${itemLines}\n\nTotal: ₹${result.total_price}`;
        const whatsappURL = `https://wa.me/${staffPhone}?text=${encodeURIComponent(message)}`;
        window.open(whatsappURL, "_blank");

        setOrderSummary(result);
        setCart([]);
        setForm({ name: "", number: "" });
        setShowForm(false);
      } else {
        alert("❌ " + result.message);
      }
    } catch (err) {
      alert("❌ Server error. Please try again later.");
    }
  };

  return (
    <div className="app-container">
      <h2 className="menu-title">Café Menu</h2>

      {tableId && <p><strong>🪑 Table: {tableId}</strong></p>}

      {menu.map((cat, idx) => (
        <div key={idx}>
          <h3 className="category-title">{cat.category}</h3>
          {cat.items.map(item => (
            <div key={item.id} className="menu-card">
              <div className="menu-info">
                <strong className="menu-name">{item.name}</strong>
                <p className="menu-price">Rs:{item.price}</p>
              </div>
              <button className="add-btn" onClick={() => addToCart(item)}>Add</button>
            </div>
          ))}
        </div>
      ))}

      <button className="cart-btn" onClick={() => setShowForm(true)} disabled={cart.length === 0}>
        🛒 View Cart ({cart.reduce((sum, i) => sum + i.qty, 0)})
      </button>

      {showForm && (
        <div className="overlay">
          <div className="modal">
            <span className="close-btn" onClick={() => setShowForm(false)}>×</span>
            <h3>Your Cart</h3>

            {cart.map(item => (
              <div key={item.id} className="cart-item">
                <strong>{item.name}</strong> - Rs:{item.price}<br />
                Qty:
                <button onClick={() => changeQty(item.id, -1)} className="qty-btn">-</button>
                {item.qty}
                <button onClick={() => changeQty(item.id, +1)} className="qty-btn">+</button>
                <button onClick={() => removeItem(item.id)} className="remove-btn">Remove</button>
              </div>
            ))}

            <hr />
            <input id="name" placeholder="Your Name" value={form.name} onChange={handleInputChange} className="input-field" />
            <input id="number" placeholder="Phone Number" value={form.number} onChange={handleInputChange} className="input-field" />
            <strong>Total: Rs:{total}</strong>

            <button onClick={handleSubmit} className="submit-btn">Submit Order</button>
          </div>
        </div>
      )}

      {orderSummary && (
        <div className="order-summary" ref={summaryRef}>
          <h3>✅ Thank You for Your Order!</h3>
          <p><strong>Order ID:</strong> {orderSummary.order_id}</p>
          <p><strong>Table:</strong> {orderSummary.table_id}</p>
          <p><strong>Time:</strong> {orderSummary.timestamp}</p>
          <p><strong>Name:</strong> {orderSummary.name}</p>
          <p><strong>Phone:</strong> {orderSummary.number}</p>
          <p><strong>Total: Rs:</strong> {orderSummary.total_price}</p>
          <p><strong>Items:</strong></p>
          <ul>
            {orderSummary.items.map((item, idx) => (
              <li key={idx}>{item.item} × {item.qty}</li>
            ))}
          </ul>
          <h3>✅ Pay at Counter!</h3>
          <h3>✅ Visit Again!</h3>
        </div>
      )}
    </div>
  );
}

export default App;
