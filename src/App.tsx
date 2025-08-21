import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import OS from "./os/OS";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route
        path="/os"
        element={
          <>
            <SignedIn><OS /></SignedIn>
            <SignedOut><RedirectToSignIn /></SignedOut>
          </>
        }
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
