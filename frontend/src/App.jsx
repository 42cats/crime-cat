import React from "react";
import { MemoryRouter as Router } from "react-router-dom";
import { Layout } from "./component/Layout";

export function App() {
    return (
        <Router>
            <Layout />
        </Router>
    );
}
