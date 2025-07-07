"use client"

import { useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useAuth } from "@/lib/auth"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import TransferModal from "./TransferModel"
import { TransferCreditModal } from "./TransferCreditModal"

function countryCodeToFlag(isoCode: string): string {
  return isoCode
    .toUpperCase()
    .replace(/./g, (char) =>
      String.fromCodePoint(127397 + char.charCodeAt(0)),
    )
}

type CountryGroup = {
  country: { country_name: string; code: string }
  services: any[]
}

export default function EmployeeDashboard() {
  const { user } = useAuth()
  const [balance, setBalance] = useState<number | null>(null)
  const [groupedServices, setGroupedServices] = useState<CountryGroup[]>([])

  /* جلب البيانات */
  const fetchData = async () => {
    try {
      const balanceRes = await api.get("/treasury/me")
      setBalance(balanceRes.data.balance)

      const res = await api.get("/services/grouped-for-employee")
      setGroupedServices(res.data)
      console.log("groupedServices response:", res.data);

    } catch (err) {
      console.error("Error loading data", err)
    }
  }

  useEffect(() => {
    if (user) fetchData()
      console.log("تم تحميل بيانات الموظف:", user)
  }, [user])

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* ترحيب باسم الموظف */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl sm:text-3xl font-bold">
          مرحباً {' '}
          <span className="text-primary">
            {user?.role === "employee" ? user.full_name : "الموظف"}
          </span>
        </h1>
        {/* <Button variant="ghost" onClick={() => auth.signOut()}>تسجيل خروج</Button> */}
      </div>

      {/* رصيد الموظف */}
      <Card className="bg-gradient-to-br from-amber-100 to-yellow-50 border-none shadow-lg">
        <CardContent className="p-4 sm:p-6 text-center space-y-2">
          <p className="text-sm sm:text-base text-muted-foreground">
            رصيدك الحالي
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-green-700">
            {balance !== null ? `${balance} LYD` : "..."}
          </h2>
          <Button
            variant="outline"
            className="w-full sm:w-auto mt-2"
            onClick={fetchData}
          >
            🔄 تحديث الرصيد
          </Button>
        </CardContent>
      </Card>

      {/* بطاقات الخدمات */}
      {groupedServices.map(({ country, services }) => (
        <div key={country.code} className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <span className="text-3xl sm:text-4xl">
              {countryCodeToFlag(country.code)}
            </span>
            {country.country_name}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => {
              const serviceWithCountry = {
                ...service,
                country_code: country.code,
              }

              return (
                <Card
                  key={service.id}
                  className="transition-shadow hover:shadow-2xl border border-gray-200"
                >
                  <CardHeader className="flex items-center gap-3 px-4 sm:px-6 py-3">
                    <div className="text-3xl sm:text-4xl">
                      {countryCodeToFlag(
                        service.image_url || country.code,
                      )}
                    </div>
                    <CardTitle className="text-lg sm:text-xl font-bold truncate">
                      {service.name}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-2 px-4 sm:px-6 pb-4 sm:pb-6">
                    <div className="flex items-center justify-start text-sm sm:text-base space-x-2 rtl:space-x-reverse">
                      <span className="text-gray-500">السعر:</span>
                      <span className="font-semibold text-primary">
                        {service.price}
                      </span>
                    </div>

                    <div className="flex items-center justify-start text-sm sm:text-base space-x-2 rtl:space-x-reverse">
                      <span className="text-gray-500">العملية:</span>
                      <span className="font-semibold">
                        {service.operation === "multiply"
                          ? "✖️ ضرب"
                          : service.operation === "divide"
                          ? "➗ قسمة"
                          : "➕ جمع"}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <TransferModal
                        service={serviceWithCountry}
                        onSuccess={fetchData}
                      />
                      <TransferCreditModal
                        service={serviceWithCountry}
                        onSuccess={fetchData}
                      />
                    </div>
                  </CardContent>

                </Card>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
