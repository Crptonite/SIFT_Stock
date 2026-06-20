import { useState } from "react";
import { Shield } from "lucide-react";
import { useNavigate } from "react-router";

export function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const handleRegister = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Account created!");
        navigate("/login");
      } else {
        alert(data.error || "Failed");
      }
    } catch (err) {
      alert("Server error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4 relative">

      <div className="w-full max-w-[420px]">

        {/* HEADER */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-foreground rounded-xl flex items-center justify-center mb-4">
            <Shield className="w-7 h-7 text-background" />
          </div>

          <h1 className="text-2xl font-bold">Create Account</h1>
          <p className="text-sm text-muted-foreground">
            Register to SIFT
          </p>
        </div>

        {/* FORM */}
        <div className="space-y-3">

          <input
            placeholder="Name"
            className="w-full p-3 rounded bg-secondary"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            placeholder="Email"
            className="w-full p-3 rounded bg-secondary"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            placeholder="Password"
            type="password"
            className="w-full p-3 rounded bg-secondary"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            onClick={handleRegister}
            className="w-full bg-foreground text-background p-3 rounded font-semibold"
          >
            Register
          </button>

        </div>

      </div>
    </div>
  );
}