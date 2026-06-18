import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {Link} from "@tanstack/react-router";
export const Route = createFileRoute("/blank-admin")({
  component: BlankAdminPage,
});

function BlankAdminPage() {
  const [selectedDevice, setSelectedDevice] = useState("");

  return (
    <main className="min-h-screen bg-background px-6 py-8 sm:px-12">
      <Link
        to="/">
        <button className="absolute top-4 left-4 rounded-md bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
          go Back
        </button>
      </Link>
      <div className="flex justify-center items-center min-h-screen flex-col gap-4  p-8 ">
        <h1 className="text-3xl font-extrabold">เลือกไอดีเครื่อง</h1>
        <div className="w-full min-w-sm max-w-3xl">
          <select
            id="device-select"
            value={selectedDevice}
            onChange={(e) => setSelectedDevice(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="">กรุณาเลือก</option>
            <option value="kiosk-1">เครื่อง 1</option>
            <option value="kiosk-2">เครื่อง 2</option>
            <option value="kiosk-3">เครื่อง 3</option>
          </select>
        </div>

        {selectedDevice ? (
          <p className="text-sm text-muted-foreground">ไอดีเครื่องคณะนี้: {selectedDevice}</p>
        ) : null}
      </div>
    </main>
  );
}
