
const AuthLayout = ({
  children
}: {
  children: React.ReactNode
}) => {
  return (
    <div className="h-screen relative">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/bg.png')",
          backgroundColor: "#597C80"
        }}
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-primary/90" />

      {/* Content */}
      <div className="relative h-full flex items-center justify-center px-6">
        <div className="max-w-sm w-full">
          {children}
        </div>
      </div>
    </div>
   );
}
 
export default AuthLayout;