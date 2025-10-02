
const AuthLayout = ({
  children
}: {
  children: React.ReactNode
}) => {
  return (
    <div
      className="h-screen flex items-center justify-center px-6 bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: "url('/bg.png')",
        backgroundColor: "#597C80"
      }}
    >
      <div className="max-w-sm w-full">
        {children}
      </div>
    </div>
   );
}
 
export default AuthLayout;