import { login } from "@/features/auth/services";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validatedData = loginSchema.safeParse(body);
    
    if (!validatedData.success) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: "Datos de inicio de sesión inválidos",
          meta: { issues: validatedData.error.issues }
        },
        { status: 400 }
      );
    }

    // Attempt login via service
    const result = await login(validatedData.data);

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.data,
        error: null,
        meta: {}
      });
    }

    return NextResponse.json(
      {
        success: false,
        data: null,
        error: result.error,
        meta: {}
      },
      { status: 401 }
    );
  } catch (error) {
    console.error("Login API Error:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: "Error interno del servidor",
        meta: {}
      },
      { status: 500 }
    );
  }
}
