import React, { createContext, useContext, useState } from "react";

const BusinessContext = createContext();

export const BusinessProvider = ({ children }) => {
  const [totals, setTotals] = useState({
    drinks: 0,
    food: 0,
    gym: 0,
    guestHouse: 0,
    billiard: 0,
    expenses: 0,
  });

  // ✅ ADD to total (income or expense)
  const updateTotal = (key, amount) => {
    setTotals((prev) => ({
      ...prev,
      [key]: prev[key] + Number(amount),
    }));
  };

  return (
    <BusinessContext.Provider value={{ totals, updateTotal }}>
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusiness = () => useContext(BusinessContext);
