# Paystack Setup Guide

To enable real payments on Gatewav, you need to configure Paystack.

## 1. Get Your API Keys
1.  **Sign Up / Log In**: Go to [https://dashboard.paystack.com/](https://dashboard.paystack.com/) and create an account or log in.
2.  **Go to Settings**: Click on **Settings** in the left sidebar.
3.  **API Keys & Webhooks**: Click on the **API Keys & Webhooks** tab.
4.  **Copy Public Key**: You will see **Test Public Key** and **Live Public Key**.
    *   Use **Test Public Key** (`pk_test_...`) for development.
    *   Use **Live Public Key** (`pk_live_...`) when you are ready to launch.

## 2. Configure Environment Variables
Create a `.env` file in your frontend root directory (`c:\Users\willi\OneDrive\Documents\Ticketing`) if it doesn't exist, and add:

```env
VITE_PAYSTACK_PUBLIC_KEY=your_public_key_here
```

Replace `your_public_key_here` with the key you copied from the Paystack dashboard.

## 3. Install Dependency
Run the following command in your terminal to install the Paystack library:

```bash
npm install react-paystack
```
